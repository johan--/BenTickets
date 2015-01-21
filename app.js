var express = require('express');
var app = express();
var querystring = require("querystring");

var zd = require("./benbria_zd");
var db = require('./db');
var https = require('https');
var fs = require('fs');
var moment = require('moment');
var generatePassword = require('password-generator');

db.init('db.json'); 
var wf_db = db.db

var nodemailer = require('nodemailer');

var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "xxxx@google.ca",
        pass: "xxxxxx"
    }
});

console.log("Zd :"+JSON.stringify(zd,null,2,true));
app.use(express.cookieParser('1234567890QWERTY'));
app.use(express.session())
//app.use(express.session({secret: '1234567890QWERTY'}));
// all environments
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(express.bodyParser({ keepExtensions:true, uploadDir: __dirname + '/public/downloads' }));
//app.use(express.bodyParser());
//app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(__dirname + '/public'));

app.get('/test', function(req,res){
  res.render("test");
});

app.get('/index',function(req,res){
  if (!(req.session.username)){
    req.session.username='';
    req.session.password='';
  }
	res.render("index", {showModal:'false',regModal:'false', passModal:'false', username:req.session.username,password:req.session.password}); 
});

app.get('/',function(req,res){
  if (!(req.session.username)){
    req.session.username='';
    req.session.password='';
  }
  res.render("index", {showModal:'false',regModal:'false', passModal:'false', username:req.session.username,password:req.session.password}); 
});

app.get('/user', function(req,res){
  res.render("user")
});

app.get('/addUser', function(req,res) { 
  userAdd(req.query.username, req.query.password, req.query.organizations,req.query.forum,res);
  res.render("user");
});

app.get('/select', function(req, res){
  if (req.session.organization) {
    console.log("value of showModal");
    res.render ("select", {organizations:req.session.orgs, username:req.session.user, orgId:req.session.organization, showModal:'false'});  
  } else {
    console.log("GOT HERE")
    res.render ("select", {organizations:req.session.orgs, username:req.session.user, orgId:req.session.organization, showModal:'true'} );
  }
});

app.get('/knowledgeBase', function(req, res){
 forum = zd.getForumDetails(req.session.forum);
 var name = forum.name;
 res.render("knowledgeBase",{name:name,gd: graphBase(req.session.forum, null), orgId:req.session.organization});
});

app.get('/changePass', function(req, res){
  res.render ("changePass", {showModal: 'false', username: req.session.user, status: 0, orgId:req.session.organization});
});

app.get('/register', function(req, res) {
  res.render("register", {regModal: 'false'});
});

app.get('/organization', function(req,res){
  console.log("ORG: "+req.session.organization);
  req.session.organization=req.query.id;
  page = req.query.page;
  if (req.query.search) {
    search = req.query.search;
  } else {
    search = null;
  }
  console.log('WHAT PAGE AM I ON? '+page);
  for (var i in req.session.orgs) {
      if (req.session.orgs[i] == req.session.organization)
          req.session.orgname=i;
  }
  console.log ('ORGNAME: '+req.session.orgname);
	
  var done = function(gd, pageNum) {
   // page = zd.getPage();
   if (!pageNum)
      pageNum = zd.getPageNum();
    console.log("THE PAGE NUMBER IS: "+page);
    res.render("organization",{gd: gd, organization:req.session.organization, orgname:req.session.orgname, page:parseInt(page), pageNum:pageNum, search:search});    
  }
  graphData(req.query.id, search, page, done); 
});

app.get('/create',function(req,res){
  ticketNew (req.session.organization,res, false,0);  //organization, showModal, return from create
});

app.get('/topicAdd',function(req,res){
  forum = zd.getForumDetails(req.session.forum);
  var name = forum.name;
  console.log(name);
  res.render("topicAdd",{result: '', name:name, orgId:req.session.organization, showModal:false});
});

app.get('/ticket',function(req,res){
  ticketData(req.query.id,res,req.session.organization, false, 0,req);
});

app.get('/topic',function(req,res){
 topicData(req.query.id, req.session.forum,res, false, 0, req.session.organization);
});

app.post('/passwordReset', function(req, res) {
  console.log("request for 'PASSWORD RESET' was called");
  var record = wf_db[req.body.email];
  
  if (record) {
    var orgs = JSON.stringify(record.orgs);
    password=generatePassword()
    wf_db[req.body.email]={"password":password,"orgs":JSON.parse(orgs)}
    var mailOptions = {
      from: "support@gmail.com",
      to: req.body.email,
      subject: "Password Reset Request",
      text: "The password for the user: "+req.body.email+"\nto the password:"+password,
    }
    smtpTransport.sendMail(mailOptions, function(error, response){
      if(error) {
          console.log(error);
      } else {
          console.log("Message sent: " + response.message);
      }
      smtpTransport.close(); // shut down the connection pool, no more messages
      req.session.username='';
      req.session.password ='';
      result=200;
      res.render("index", {showModal:'false', regModal:'false', passModal:'true', result: result,username:req.session.username, password:req.session.password});
    });
  } else {
    result=400;
    res.render("index", {showModal:'false', regModal:'false', passModal:'true', result: result,username:req.session.username, password:req.session.password});
  }
});

app.post('/registerUser', function(req, res) {
  console.log("request for 'REGISTER USER' was callled")
  var mailOptions = {
    from: "support@gmail.com",
    to: "name@name.com",
    subject: "New Account Request",
    text: "The following account request was made.\nName: "+req.body.firstname+" "+req.body.lastname+" "+"\nEmail: "+req.body.email+"\nOrganizations: "+req.body.organization,
  }
  smtpTransport.sendMail(mailOptions, function(error, response){
    if(error){
        console.log(error);
        result = 400;
    }else{
        console.log("Message sent: " + response.message);
        result = 200;
    }
    smtpTransport.close(); // shut down the connection pool, no more messages
    req.session.username='';
    req.session.password ='';
    res.render("index", {showModal:'false', regModal:'true', passModal:'false',result: result,username:req.session.username, password:req.session.password});
  });

});


app.post('/userCheck', function(req, res) {
  console.log("request for 'CHECK USER' was a called.");
  console.log(JSON.stringify(req.body));
  var username = req.body.username;
  var password = req.body.password;
  if (req.body.checkbox=='on') {
    req.session.username=req.body.username;
    req.session.password =req.body.password;
  } else {
    req.session.username='';
    req.session.password ='';
  }
  var record = wf_db[username];
  console.log(JSON.stringify(wf_db))

  if (record && record.password == password){
      req.session.orgs=record.orgs;
      req.session.user=username;
      req.session.forum=record.forum;
      console.log("ORG: "+JSON.stringify(record.orgs));
      console.log("COUNT: "+Object.keys(record.orgs).length);
      if (Object.keys(record.orgs).length == 1) {
        var value = record.orgs[Object.keys(record.orgs)[0]]
        console.log("VALUE: "+value);
        req.session.organization = value;
        req.session.orgname = Object.keys(record.orgs)[0];
        console.log(req.session.orgname)
        var done = function(gd) {
          pageNum = zd.getPageNum();
          orgRec = zd.getRec();
          console.log("THE TOTAL NUMBER OF ORG RECRODS ARE: "+orgRec+" THE TOTAL PAGE NUMBERS IS: "+pageNum);
          res.render("organization",{gd: gd, organization:value, orgname:req.session.orgname, page:1, pageNum:pageNum});    
        }
        graphData(req.session.organization, null, 0, done);
      } else {
        return res.render("select",{organizations:record.orgs, username:username, res:res, showModal:'false'});
      }
  } else {
    res.render("index", {showModal:'true',regModal:'false', passModal:'false', username:req.session.username, password:req.session.password});
  }
});

app.post('/searchRequest', function(req, res){
  if (req.body.search) {
    search = req.body.search
  } else {
    console.log('SEARCH GOT HERE!');
    search = req.query.search
  }
  console.log("request for Search was called: "+req.body.search);
  if (req.query.page) {
    page = req.query.page
  } else {
    page = 0;
  }
  var done = function(gd, pageNum) {
    if (!pageNum)
      pageNum = zd.getPageNum();
    res.render("organization",{gd: gd, organization:req.session.organization, orgname:req.session.orgname, search:search, page:1, pageNum:pageNum});    
  }
  graphData(req.session.organization, search, page, done);
});

app.post('/searchForum', function(req, res){
  console.log("request for Search Forum was called: "+req.body.search);
  var done = function(name, gd) {
      res.render("knowledgeBase",{name:name,gd: gd, orgId:req.session.organization});    
  }
  graphBase(req.session.forum,req.body.search, done);
});

app.post('/changePass', function(req, res) {
  console.log("request for 'Check Password Change' was a called.");
  var status = 0;
  var passCurr = req.body.currPass;
  var passFirst = req.body.passFirst;
  var passSecond = req.body.passSecond;
  var username = req.session.user;
  var record = wf_db[username];
  var orgs = JSON.stringify(record.orgs);
  var forum = record.forum;

  if ( passCurr == record.password) {
    if (passFirst == passSecond) {
      wf_db[username]={"password":passFirst,"orgs":JSON.parse(orgs), "forum":forum}
      status = 200;
      res.render("changePass", {showModal: 'true', username: username, status: status, orgId:req.session.organization});
    } else {
      status = 500;
      res.render("changePass", {showModal: 'true', username: username, status: status, orgId:req.session.organization});
    }
  } else {
    status = 400;
    res.render("changePass", {showModal: 'true', username: username, status: status, orgId:req.session.organization});
  }

  console.log("STATUS: "+status);

});

var processNewReq = function(res,req,tokens,id,subject,comment,user,data,cb){
  if (data.length == 0) 
    return cb(null, res, req,tokens,id,subject,comment,user);
  var f = data.shift();
  if (f.originalFilename){
    var split = f.path.split('/');
    var filePass = 'public/downloads/'+split[split.length - 1];
    url = encodeURIComponent(f.name);
    var fileName = {
      filename: url
    }
    zd.attachment(filePass,fileName, function (result) {
      console.log("ATTACHMENT RESULT: "+JSON.stringify(result,null,2,true));
      tokens.push(result.upload.token);
      processNewReq(res, req,tokens,id,subject,comment,user,data,cb);
    });   
  } else 
    processNewReq(res, req,tokens,id,subject,comment,user,data,cb);
}

var zendeskNewCB = function(err,res, req, tokens,orgId,subject,comment,userId){
  if (err) return console.log(err);
   var ticketJson = {
    "ticket": {
      "organization_id": orgId,
      "requester_id": userId,
      "subject": subject,
      "comment": { 
        "public":"true",
        "body":comment,
        "uploads": tokens
      }
    }
  }
  console.log('ORG: '+orgId);
  console.log(' SUB: '+subject+' COMMENT: '+comment+' USER: '+userId);
  console.log(JSON.stringify(tokens));
  zd.createTicket(ticketJson,function(result) {
    console.log("results: " + result);
    ticketNew(orgId, res, true, result); });
}

app.post('/ticketCreate', function(req, res) {
  var orgId = req.body.organization;
  var comment = req.body.comment;
  var subject = req.body.subject;
  var userId ='';
  console.log('ORG: '+orgId);
  
  body = zd.getOrgUser(orgId, function(body) {
   /* userId = body[0].id;
    console.log("THE USER DATA1: "+JSON.stringify(body[0],null,2,true)+" THE USER DATA2: "+JSON.stringify(body[1],null,2,true));
    console.log("THE USER NAME: "+req.session.user); */
    for (var i = 0; i<body.length; i++) {
      if (body[i].email == req.session.user) {
        userId = body[i].id;
      }
    }
    var data = [];
    for (var i = 0; i <req.files.data.length; i++)
      data.push(req.files.data[i]);
    processNewReq(res,req,[],orgId,subject,comment,userId,data,zendeskNewCB);
  });
});

var processReq = function(res,req,tokens,id,comment,user,data,cb){
  if (data.length == 0) 
    return cb(null, res, req,tokens,id,comment,user);
  var f = data.shift();
  if (f.originalFilename){
    var split = f.path.split('/');
    var filePass = 'public/downloads/'+split[split.length - 1];
    console.log('THE FILE: '+ filePass);
    url = encodeURIComponent(f.name);
    var fileName = {
      filename: url
    }
    zd.attachment(filePass,fileName, function (result) {
      console.log("ATTACHMENT RESULT: "+JSON.stringify(result,null,2,true));
      tokens.push(result.upload.token);
      processReq(res, req,tokens,id,comment,user,data,cb);
    });
  } else 
    processReq(res, req,tokens,id,comment,user,data,cb);
}

var zendeskCB = function(err,res, req, tokens,id,comment,user){
  if (err) return console.log(err);
  var ticketJson = {
    "ticket": {
   //  "submitter_id":user,
      "requester_id": user,
      "comment": { 
        "public":"true",
        "body":comment,
        "uploads": tokens
      }
    }
  }
  console.log('ticket data: '+JSON.stringify(ticketJson,null,2,true));
  if (comment) {
    zd.updateTicket(id,ticketJson,function(result) {
      console.log("results: " + result);
      ticketData(id,res,req.session.organization, true, result); 
    });
  } else {
    result = 422;
    ticketData(id,res,req.session.organization, true, result);
  }
}

app.post('/ticketUpdate', function(req, res) {
  console.log('the ORG: '+req.session.organization);
  var orgId = req.session.organization;
  var id = req.body.id;
  var comment = req.body.comment;
  body = zd.getOrgUser(orgId, function(body) {
   for (var i = 0; i<body.length; i++) {
      if (body[i].email == req.session.user) {
        userId = body[i].id;
      }
    }
    var data = [];
    for (var i = 0; i <req.files.data.length; i++)
      data.push(req.files.data[i]);
    processReq(res,req,[],id,comment,userId,data,zendeskCB);
  });
});

var processTop = function(res,req,tokens,subject,comment,data,cb){
  if (data.length == 0) 
    return cb(null, res, req,tokens,subject,comment);
  var f = data.shift();
  if (f.originalFilename){
    var split = f.path.split('/');
    var filePass = 'public/downloads/'+split[split.length - 1];
    url = encodeURIComponent(f.name);
    var fileName = {
      filename: url
    }
    zd.attachment(filePass,fileName, function (result) {
      console.log("ATTACHMENT RESULT: "+JSON.stringify(result,null,2,true));
      tokens.push(result.upload.token);
      processTop(res, req,tokens,subject,comment,data,cb);
    });
  } else 
    processTop(res, req,tokens,subject,comment,data,cb);
}

var topicCB = function(err,res, req, tokens, subject, comment){
  if (err) return console.log(err);
  forum = zd.getForumDetails(req.session.forum);
  console.log(JSON.stringify(forum));
  var name = forum.name;
   var topicJson = {
    "topic": {
      "forum_id":req.session.forum,
      "title":subject,
      "body":comment,
      "uploads": tokens
    }
  }
  console.log( 'SUB: '+subject+' COMMENT: '+comment+' FORUM ID: '+req.session.forum);
  console.log(JSON.stringify(topicJson));
  zd.createTopic(topicJson,function(result) {
    console.log("results: " + result);
    res.render("topicAdd",{result: result, name:name,showModal:true});
  });
}

app.post('/upload', function(req, res) {
   //console.log(require('util').inspect(req.files, {depth:null}));
   fs.readFile(req.files.file.path, function (err, data) {
    var imageName = req.files.file.originalFilename
    console.log("IMAGE NAME: "+imageName);
    if(!imageName){
      console.log("There was an error")
      res.redirect("/");
      res.end();
    } else {
      var newPath = __dirname + '/public/' + imageName;
      fs.writeFile(newPath, data, function (err) {
        console.log("THE FILE IS HERE: "+newPath);
        res.send(200);
      });
    }
  });
});

app.post('/topicCreate', function(req, res) {
  var orgId = req.body.organization;
  var comment = req.body.comment;
  var subject = req.body.subject;
  var userId ='';
  
  var data = []; 
  for (var i = 0; i <req.files.data.length; i++)
    data.push(req.files.data[i]);
  processTop(res,req,[],subject,comment,data,topicCB);
});

var processComm = function(res,req,tokens,id,comment,data,cb){
  if (data.length == 0) 
    return cb(null, res, req,tokens,id,comment);
  var f = data.shift();
  if (f.originalFilename){
    var split = f.path.split('/');
    var filePass = 'public/downloads/'+split[split.length - 1];
    url = encodeURIComponent(f.name);
    var fileName = {
      filename: url
    }
    zd.attachment(filePass,fileName, function (result) {
      console.log("ATTACHMENT RESULT: "+JSON.stringify(result,null,2,true));
      tokens.push(result.upload.token);
      processComm(res, req,tokens,id,comment,data,cb);
    });
  } else 
    processComm(res, req,tokens,id,comment,data,cb);
}

var commentCB = function(err,res, req, tokens,id,comment){
  if (err) return console.log(err);
  var commentJson = {
    "topic_comment": {
      "body":comment,
      "uploads": tokens
    }
  }
  console.log('comment data: '+JSON.stringify(commentJson,null,2,true));
  zd.updateComment(id,commentJson,function(result) {
    console.log("results: " + result);
    topicData(id, req.session.forum, res, true, result, req.session.organization); });
}

app.post('/commentUpdate', function(req, res) {
  var id = req.body.id;
  console.log("TOPIC ID: "+id);
  var comment = req.body.comment;
  var data = [];
  for (var i = 0; i <req.files.data.length; i++)
    data.push(req.files.data[i]);
  processComm(res,req,[],id,comment,data,commentCB);
});

var userAdd = function(username, password, organizations, forum, response){
  wf_db[username]={"password":password,"orgs":JSON.parse(organizations),"forum":forum}
  console.log(JSON.stringify(db[username]))
  
  var mailOptions = {
      from: "support@gmail.com",
      to: username,
      subject: "Your account had been created",
      text: "Welcome to Benbria Online ticket at http://xxxx.xxxx.com.\nPlease note your \nUsername: "+username+"\nPassword: "+password+"\nThank you\n xxxxx Team" ,
  }
  smtpTransport.sendMail(mailOptions, function(error, response){
    if(error) {
        console.log(error);
    } else {
        console.log("Message sent: " + response.message);
    }
    smtpTransport.close(); // shut down the connection pool, no more messages
  });
}

var ticketNew = function(orgId,res,showModal, result) {
  console.log("request for 'NEW TICKET' was called.");
  console.log("ORGANIZATION: "+orgId);

  res.render("create",{result: result, organization: orgId, showModal:showModal});
}

var ticketData = function(id, res, orgId,showModal, result,req) {
  console.log("request for handler 'TicketData' was called.");
  console.log("ticket Data arg: (id):" + id);
  console.log("Organization Id: "+ orgId);
  var author='';

  zd.getAudit(id, function(body){
    //console.log('GOT HERE!!!!\n'+JSON.stringify(body,null,2,true)+ "\nTHE COUNT: "+body[0].count+' '+body[0].next_page);
    var comments = [];
    var newAttachments = [];
    var user = zd.getTicketAuthor(id);
    for (var i = 0; i < body[0].count; i++) {
     //console.log("WHOLE AUDIT: "+JSON.stringify(body.audits[i],null,2,true));
     // INITIALIZED THE COMMENTS OBJECT BEFORE POPULATING
      comment = {};
      comment.attachments = [];
      for (var j = 0; j < body[0].audits[i].events.length; j++) {
        // console.log("WHOLE EVENT: "+JSON.stringify(body.audits[i].events[j],null,2,true));
        // THE FIRST RECORD IN THE EVENTS AUDIT IS ALWAYS HANDLED AS ORIGINAL TICKET
        if (i == 0 && j== 0) {
         // console.log("FIRST EVENT: "+JSON.stringify(body.audits[i].events[j],null,2,true));
          var description = body[0].audits[i].events[0].html_body;
          var dcreate_test = new Date(body[0].audits[i].created_at);
          var dcreate_date = moment(dcreate_test).format("dddd, MMMM Do YYYY, h:mm:ss a")
          if (body[0].audits[i].events[j].attachments.length != 0) {
            for (var k=0;k<body[0].audits[i].events[j].attachments.length; k++) {
              att = {};
              att.url = body[0].audits[i].events[j].attachments[k].content_url;
              att.filename = body[0].audits[i].events[j].attachments[k].file_name;
              newAttachments.push(att);
            }
          }
        }
        // THE NOTIFICATION EVENT WITH BODY HAVING 'YOUR REQUEST' CONTAINS THE AUTHOR ID OF THE COMMENT
        if (body[0].audits[i].events[j].type == "Notification") {
          if (body[0].audits[i].events[j].body.match(/Your request/g)) {
            // WEB CHANNEL REPRESENTS ENTRY FROM ZENDESK SO USE AUTHOR ID AS ALL COMMENTS ARE ENTERED AS ADMIN
            if (body[0].audits[i].via.channel == 'web') {
              var author = zd.getUser(body[0].audits[i].author_id);
              comment.author_name=author;
            // TICKETS FROM tickets.benbria.com ARE FROM THE API CHANNEL GET FIRST ELEMENT FROM RECIPIENT ARRAY
            } else {
              console.log("RECIPIENT API: "+body[0].audits[i].events[j].recipients[0]);
              var author = zd.getUser(body[0].audits[i].events[j].recipients[0]);
              comment.author_name=author;
              // IF CUSTOMER LINKED TO TICKET FROM THEIR EMAIL, POPULATE SESSION FIELDS
              if (!orgId) {
                orgId = zd.getUserOrg(body[0].audits[i].events[j].recipients[0]);
                console.log('THE ORGINIZATION: '+orgId);
                req.session.organization = orgId;
                req.session.user = zd.getUserEmail(body[0].audits[i].events[j].recipients[0]);
                var record = wf_db[req.session.user];
                req.session.forum = record.forum;
                req.session.orgs=record.orgs;
              }
            }
          } else {
            // IF NOTIFICATION CAME FROM EMAIL RESPONSE GET THE AUTHOR ID
            if (body[0].audits[i].via.channel == 'email') {
              var author = zd.getUser(body[0].audits[i].author_id);
              console.log('THE AUTHOR: '+author);
              comment.author_name=author;
            }
          }
        // GET ALL OTHER COMMENT FIELDS FROM THE COMMENT EVENT
        } else {
          if (body[0].audits[i].events[j].type == "Comment" && body[0].audits[i].events[j].public==true && i != 0) {
           var comment_date = new Date(body[0].audits[i].created_at);
           // console.log('A FULL EVENT: '+JSON.stringify(body.audits[i].events[j],null,2,true));
            comment.created_test = comment_date;
            comment.created_at = moment(comment.created_test).format("dddd, MMMM Do YYYY, h:mm:ss a")
            comment.comment = body[0].audits[i].events[j].html_body;
            comment.author_name = author;
            if (body[0].audits[i].events[j].attachments.length != 0) {
              for (var k=0;k<body[0].audits[i].events[j].attachments.length; k++) {
                //console.log("URL: "+body.audits[i].events[j].attachments[k].content_url+" FILENAME: "+body.audits[i].events[j].attachments[k].file_name);
                attachment = {};
                attachment.url = body[0].audits[i].events[j].attachments[k].content_url;
                attachment.filename = body[0].audits[i].events[j].attachments[k].file_name;
                comment.attachments.push(attachment);
              }
            }
            comments.push(comment);
          }
        }
        // console.log('THE OTHER STUFF: '+body[0].audits[i].events[j].field_name);
        switch (body[0].audits[i].events[j].field_name) {
          case 'subject':
            var subject = body[0].audits[i].events[j].value;
            break;
          case 'status':
            state = {};
            var update_date = new Date(body[0].audits[i].created_at);
            state.created_at = moment(update_date).format("dddd, MMMM Do YYYY, h:mm:ss a");
            state.status = body[0].audits[i].events[j].value.toUpperCase();
            break;
          case 'priority':
             if (body[0].audits[i].events[j].value) {
              var priority = body[0].audits[i].events[j].value.toUpperCase();
            } else {
              var priority = "Value not yet assigned";
            }
            break;
          case 'type':
            if (body[0].audits[i].events[j].value) {
              var type = body[0].audits[i].events[j].value.toUpperCase();
              } else {
              var type = "VALUE NOT ASSIGNED"
            }
            break;
        }
      }
    }
    // console.log("ALL COMMENT: "+JSON.stringify(comments,null,2,true));
    res.render("ticket",{result: result, orgId:orgId, showModal:showModal,comments:comments, state:state, description:description,dcreate_date:dcreate_date,id:id,ticket:id,subject:subject,priority:priority,type:type, newAttachments:newAttachments});
  });
};

var topicData = function(id, forum, res, showModal, result, orgId) {
  console.log('TOPIC ID: '+id);
  var body = zd.getTopicDetails(id);
  var created_at = moment(new Date(body.created_at)).format("dddd, MMMM Do YYYY, h:mm:ss a");
  var forum = zd.getForumDetails(forum);
  console.log(JSON.stringify('BODY: '+body));
  var name = forum.name;
  var newAttachments = [];
  if (body.attachments.length != 0) {
    for (var k=0;k<body.attachments.length; k++) {
      att = {};
      att.url = body.attachments[k].content_url;
      att.filename = body.attachments[k].file_name;
      newAttachments.push(att);
    }
  }

  if (body.comments_count > 0) {
    comment = [];
    zd.getTopicComments(id, function(comments) {
      for(var i = 0; i<comments.length;i++) {
          com={};
          com.attachments = [];
          console.log("DATE: "+JSON.stringify(comments[i].created_at));
          com.comment = comments[i].body;
          console.log("COMMENT: "+JSON.stringify(com.comment));
          var comment_date = moment(new Date(comments[i].created_at)).format("dddd, MMMM Do YYYY, h:mm:ss a");
          com.created_at = comment_date;

          if (comments[i].attachments.length != 0) {
              for (var k=0;k<comments[i].attachments.length; k++) {
                console.log("URL: "+comments[i].attachments[k].url+" FILENAME: "+comments[i].attachments[k].file_name);
                attachment = {};
                attachment.url = comments[i].attachments[k].content_url;
                attachment.filename = comments[i].attachments[k].file_name;
                com.attachments.push(attachment);
              }
          }
          comment.push(com);
      }
      res.render("topic",{id:id, subject:body.title, created_at:created_at,forum:name,body:body.body, newAttachments:newAttachments, comments:comment, result: result, orgId:orgId, showModal: showModal});
    });
  } else {
    res.render("topic",{id:id, subject:body.title, created_at:created_at,forum:name,body:body.body, newAttachments:newAttachments, result: result, orgId:orgId, showModal: showModal});
  }
};

var graphData = function(id, search, page, done) {
  console.log("request for handler 'TICKET CHART' was called.");
  var fields=[];
  var graphData = {};
  graphData.cols = [];
  graphData.rows = [];
  graphData.cols[0] = {"id":"","label":"ID","type":"number"};
  graphData.cols[1] = {"subject":"","label":"SUBJECT","type":"string"};
  graphData.cols[2] = {"type":"","label":"TYPE","type":"string"};
  graphData.cols[3] = {"customer":"","label":"CUSTOMER","type":"string"};
  graphData.cols[4] = {"category":"","label":"CATEGORY","type":"string"};
  graphData.cols[5] = {"requested":"","label":"REQUESTED","type":"string"};
  graphData.cols[6] = {"solved":"","label":"LAST UPDATE","type":"string"};
  graphData.cols[7] = {"status":"","label":"STATUS","type":"string"};
  
  console.log(id);
  var j = 0;
  if (search == null) {
   // var body = zd.getBody(id); 
    var orgName = zd.getOrganizationName(id);
    var body = zd.getTicketBody(orgName, page);
    if (body.length == 0) {
      done(false);
    } else {
     // for (var i = body.length -1; i >= 0; i--) {
      for (var i=0;i<body.length; i++) {
        if (body[i].status != 'Deleted') {
          field = body[i].field_22799616;
          var request_test = new Date(body[i].created_at); 
          var request_date = moment(request_test).format("MMMM Do YYYY");
          var update_test = new Date(body[i].updated_at)
          var update_date = moment(update_test).format("MMMM Do YYYY");
          graphData.rows[j] = {"c":[{"v":body[i].id,"f":null},{"v":body[i].subject,"f":null},{"v":body[i].ticket_type,"f":null},{"v":orgName,"f":null},{"v":field,"f":null},{"v":request_date.toString(),"f":null},{"v":update_date.toString(),"f":null},{"v":body[i].status,"f":null},]};
          j++;
        }
      }
      done(graphData, null);
    }
  } else { 
    var string = search+' type:ticket organization:'+id;
    zd.getQuery(string, function(body) {
      var organization = zd.getOrganization(id);
      if (body == 'Error: Zendesk Error (500): Internal Server Error') {
        done(false);
      }
      if (body.length == 0) {
        console.log('NOTHING FOUND IN TICKET SEARCH');
        done(false, 1);
      } else {
        //for (var i = body.length -1; i >= 0; i--) {
        var count = 0;
        if (page == 0)
          startPage = page * 15;
        else
          startPage = (page - 1) * 15;
        finishPage = startPage + 15;
        for (var i=0;i<body.length; i++) {
          count++;
          if (count > startPage && count <= finishPage) {
            console.log("GOT HERE!"+body[i].id);
            field = body[i].custom_fields[2].value;
            var request_date = new Date(body[i].created_at); 
            var update_date = new Date(body[i].updated_at)
            console.log('ID: '+body[i].id+' SUBJECT: '+body[i].subject+' TYPE: '+body[i].type+' ORGANIZATION: '+organization+' CATEGORY: '+field+' REQUEST DATE '+request_date+' UPDATE DATE: '+update_date+' STATUS: '+body[i].status);
            graphData.rows[j] = {"c":[{"v":body[i].id,"f":null},{"v":body[i].subject,"f":null},{"v":body[i].type,"f":null},{"v":organization,"f":null},{"v":field,"f":null},{"v":request_date.toString(),"f":null},{"v":update_date.toString(),"f":null},{"v":body[i].status,"f":null},]};
            j++;
          }
        }
        pageNum = Math.round(count / 15); 
        if (count >=1 && pageNum == 0) {
          pageNum = 1;
        }
        console.log("TOTAL PAGES IN GRAPHDATA: "+pageNum+" COUNT IN GRAPHDATA: "+count);
        done(graphData, pageNum);
      } 
    });
  }
};

var graphBase = function(forum, search, done) {
  console.log("request for handler 'FORUM LIST' was called.");
  var graphData = {};
  graphData.cols = [];
  graphData.rows = [];
  graphData.cols[0] = {"id":"","label":"ID","type":"number"};
  graphData.cols[1] = {"Title":"","label":"TITLE","type":"string"};
  graphData.cols[2] = {"Create Date":"","label":"DATE CREATED","type":"string"};
  graphData.cols[3] = {"Commented":"","label":"NUMBER OF COMMENTS","type":"number"};
  console.log('HERE IS THE FORUM ID: '+forum);
  var j = 0;
  if (search == null) {
    var body = zd.getTopics(forum);
    if (body.length == 0) {
     return false;
    } else {
      for (var i=0; i < body.length; i++) {
       var request_test = new Date(body[i].created_at); 
       var request_date = moment(request_test).format("dddd, MMMM Do YYYY, h:mm:ss a");
       graphData.rows[j] = {"c":[{"v":body[i].id,"f":null},{"v":body[i].title,"f":null},{"v":request_date.toString(),"f":null},{"v":body[i].comments_count,"f":null},]};
       j++;
      } 
     return(graphData);
    }   
  } else {
    var string = search+' type:topic forum_id:'+forum;
    forum = zd.getForumDetails(forum);
    var name = forum.name;
    zd.getQuery(string, function(body) {
      if (body == 'Error: Zendesk Error (500): Internal Server Error') {
        done(false);
      }
      if (body.length == 0) {
        console.log('NOTHING FOUND IN FORUM SEARCH');
        done(name, false);
      } else {
        for (var i=0; i < body.length; i++) {
         var request_test = new Date(body[i].created_at);
         var request_date = moment(request_test).format("dddd, MMMM Do YYYY, h:mm:ss a");
         graphData.rows[j] = {"c":[{"v":body[i].id,"f":null},{"v":body[i].title,"f":null},{"v":request_date.toString(),"f":null},{"v":body[i].comments_count,"f":null},]};
         j++;
        } 
        done(name, graphData);
      } 
    });  
  }
};

app.listen(3000);
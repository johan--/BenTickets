var zendesk = require('node-zendesk');
var fs = require('fs');
var https = require('https');
var http = require('http');

var __zendesk_file = "zd.json";

var interval =  60 * 50 * 50; // secs
var client = zendesk.createClient({
    username: 'PUT YOUR USERNAME/EMAIL',
    token: 'PUT YOUR TOKEN HERE',
    remoteUri: 'https://COMPANY.zendesk.com/api/v2',
    //remoteUri: 'http://localhost:8080/api/v2'
});


var zd = {statusList:null, body:[],responseList:null,resultList:null,lastUpdate:null, tickets:[], count:0, pageNum:0};

client.organizations.list(function (err, statusList, body, responseList, resultList) {
  if (err) {
      console.log(err);
      return;
    }
    zd.organization = body;
})

 client.users.list(function (err, statusList, body, responseList, resultList) {
  if (err) {
      console.log(err);
      return;
    }
    zd.user = body;
}) 


exports.getAudit = function(id, callback) {
    client.tickets.exportAudit(id, function (err, statusList, body, responseList, resultList) {
      if (err) {
        console.log("Error audit id?");
        return;
      } 
     // console.log('BODY: '+JSON.stringify(body,null,2,true));
     // console.log('RESULT: '+JSON.stringify(resultList,null,2,true));
     callback(resultList);
    });
}

 exports.getTopicComments = function(id, callback) {
    client.topiccomments.list(id, function (err, statusList, body, responseList, resultList) {
      if (err) {
        console.log("Error on TOPIC COMMENTS?");
        callback(null);
        return;
      } 
     callback(body);
    });
} 


exports.getOrgTickets = function(id, callback) {
  client.tickets.listByOrganization(id, function(err,statusList, body, responseList, resultList) {
    if (err) {
        console.log("Error on ORG TICKTETS?");
        callback(null);
        return;
    } 
 //   console.log('LENGTH: '+body.length)
    callback(body);
  });
}

exports.getOrgUser = function(id, callback) {
  client.users.listByOrganization(id, function (err, statusList, body, responseList, resultList) {
    if (err) {
      console.log('ERROR: '+err);
      callback(err);
    }
    callback(body);
  });
}

exports.updateTicket = function (id, ticketData, callback) {
  client.tickets.update(id, ticketData, function (err, statusList, body, responseList, resultList) {
    if (err) {
      console.log('ERROR: '+err);
      callback(err);
    }
    callback(statusList);
  });
}

exports.updateComment = function (id, commentData, callback) {
  client.topiccomments.create(id, commentData, function (err, statusList, body, responseList, resultList) {
    if (err) {
      console.log('ERROR: '+err);
      callback(err);
    }
    callback(statusList);
  });
}

exports.createTopic = function (Data, callback) {
  client.topics.create(Data, function (err, statusList, body, responseList, resultList) {
    if (err) {
      console.log('ERROR: '+err);
      callback(err);
    }
    callback(statusList);
  });
}

exports.getQuery = function(search, callback) {
  client.search.query(search, function (err, statusList, body, responseList, resultList) {
    if (err) {
      console.log('ERROR: '+err);
      callback(err);
    }
    callback(body);  
  });
}

exports.createTicket = function (ticketData, callback) {
  client.tickets.create(ticketData, function (err, statusList, body, responseList, resultList) {
    if (err) {
      console.log('ERROR: '+err);
      callback(err);
    }
    callback(statusList);
  });
}

exports.attachment = function (file, fileToken, callback) {
  client.attachments.upload(file,fileToken, function (err,statusList, body, responseList, resultList) {
    if (err) {
      console.log("ERROR: "+JSON.stringify(err,null,2,true));
      callback(err);
    }
    callback(body);  
  });
}

var n = 1;
var t = 0;
var start= 0;
var start_time = 0;
var output = [];
var hold = [];
var index = {};

var update = function(){
  console.log("..." + n++); 
  fiveMinute = Math.round((new Date() - (5 * 60 * 1000)) / 1000);
  console.log("START TIME: "+start_time+" FIVE MINUTE TIME: "+fiveMinute);
  
  if (start_time > fiveMinute)
    start_time = fiveMinute;

  client.tickets.export(start_time, function(err, statusList, body, responseList, resultList) {
    if (err) {
      return;
    }
    //console.log('THE TICKET FIRST THOUSAND: '+JSON.stringify(body));
    output = [];
    if (start == 0) {
      zd.tickets = body.results;
      console.log('NUMBER OF RESULTS: '+body.results.length);
      for (var i=0; i<body.results.length; i++) {
        index[body.results[i].id] = i 
        t++;
      }
      start = 1
    } else {
      for (var i=0; i<body.results.length; i++) {
        if (body.results[i].id in index) {
          zd.tickets[index[body.results[i].id]] = body.results[i]
          console.log ('THE NEW ID: '+body.results[i].id);
        } else {
          zd.tickets = zd.tickets.concat(body.results[i]);
          index[body.results[i].id] = t;
          t++;
        }
      }
    }
    console.log('END TIME: '+body.end_time);
    start_time = body.end_time;
  })

  client.topics.list(function (err, statusList, body, responseList, resultList) {
    if (err) {
      return;
    }
    zd.topics = body;
  })
  client.forums.list(function (err, statusList, body, responseList, resultList) {
    if (err) {
      return;
    }
    zd.forums = body;
  })
  client.organizations.list(function (err, statusList, body, responseList, resultList) {
    if (err) {
        console.log(err);
        return;
      }
      zd.organization = body;
  })

   client.users.list(function (err, statusList, body, responseList, resultList) {
    if (err) {
        console.log(err);
        return;
      }
      zd.user = body;
  })

};

update();
setInterval(update, interval);

exports.getTopics = function(id){
  if (id && zd.topics){
    var result =[];
    for(var i=0; i<zd.topics.length; i++)
      if (zd.topics[i].forum_id==id)
        result.push(zd.topics[i]);
  }
  return result;
}

exports.getTopicDetails = function(id){
  if (id && zd.topics){
    for(var i=0; i<zd.topics.length; i++) {
      if (zd.topics[i].id == id)
        return(zd.topics[i]);
    }
  }
}

exports.getForumDetails = function(id){
  if (id && zd.forums){
    for(var i=0; i<zd.forums.length; i++) {
      if (zd.forums[i].id == id)
        return(zd.forums[i]);
    }
  }
}

exports.getOrganization = function(id){
  if (id && zd.organization){
    var result = [];
    for(var i=0; i< zd.organization.length; i++)
      if (zd.organization[i].id == id)
        result.push(zd.organization[i].name);
    } 
  return result;
}

exports.getOrganizationName = function(id){
  if (id && zd.organization){
    var result = [];
    for(var i=0; i< zd.organization.length; i++)
      if (zd.organization[i].id == id)
        result.push(zd.organization[i].name);
    } 
  return result;
}

exports.getUser = function(id){
  if (id && zd.user){
    var result = '';
    for(var i=0; i< zd.user.length; i++) {
      if (zd.user[i].id == id) {
      //console.log('USER: '+JSON.stringify(zd.user[i],null,2,true));
        result = zd.user[i].details;
      }
    }
  } 
  return result;
} 

exports.getUserOrg = function(id){
  if (id && zd.user){
    var result = '';
    for(var i=0; i< zd.user.length; i++) {
      if (zd.user[i].id == id) {
        //console.log('USER: '+JSON.stringify(zd.user[i],null,2,true));
        result = zd.user[i].organization_id;
      }
    }
  } 
  return result;
} 

exports.getUserEmail = function(id){
  if (id && zd.user){
    var result = '';
    for(var i=0; i< zd.user.length; i++) {
      if (zd.user[i].id == id) {
        //console.log('USER: '+JSON.stringify(zd.user[i],null,2,true));
        result = zd.user[i].email;
      }
    }
  } 
  return result;
} 

/*exports.getFields = function(id){
  if (id && zd.body) {
    console.log ('LENGTH: '+zd.body.length);
    var result = [];
    for (var i=0; i<zd.body.length; i++) {
      if (zd.body[i].id == id) {
        //console.log("THE ID OF SEARCH: "+id);
        for (var j=0; j<3; j++){
          result.push(zd.body[i].fields[j].value);
        }
        //console.log(JSON.stringify(result,null,2,true));
        return result;
      }
    }
  } else return zd.body;
} 

exports.getBody = function(organization){
  if (organization && zd.body) {
    var result = [];
    for(var i=0; i< zd.body.length; i++)
      if (zd.body[i].organization_id == organization)
        result.push(zd.body[i]);
    return result;
  } else return [];
}; */

exports.getTicketBody = function(orgName, page){
  if (orgName && zd.tickets) {
    console.log('ORG NAME: '+orgName);
    var result = [];
    zd.count = 0;
    if (page == 0)
      startPage = page * 15;
    else
      startPage = (page - 1) * 15;
    finishPage = startPage + 15;
    console.log ("START: "+startPage+" FINISH: "+finishPage);
    for(var i=zd.tickets.length-1; i >= 0; i--) {
      // console.log('THE TICKET: '+i+' '+JSON.stringify(zd.tickets[i],null,2,true));
      if (zd.tickets[i].organization_name == orgName  && zd.tickets[i].status != 'Deleted') {
        zd.count++;
        if (zd.count > startPage && zd.count <= finishPage) {
          console.log('COUNTER: '+zd.count+' THE TICKET ID: '+zd.tickets[i].id);
          result.push(zd.tickets[i]);
        }
      }
    }
    pageCalc = (zd.count / 15);
    pageTest = Math.round(zd.count / 15);
    if (pageCalc > pageTest) {
      zd.pageNum = pageTest + 1;
    } else {
      zd.pageNum = pageTest;
    }
    zd.page = page;
    console.log ('THE PAGE NUMBER: '+zd.pageNum);
    return result;
  } else return [];
};

exports.getAuth = function(ticket){
  if (ticket && zd.body) {
    //console.log(ticket);
    var result = [];
    for(var i=0; i< zd.body.length; i++)
       if (zd.body[i].id == ticket)
       //  console.log (JSON.stringify(zd.body[i].organization_id,null,2,true));
         result.push(zd.body[i].organization_id);
    return result;
  } else return [];
}

exports.getTicket = function(id){
  if (id && zd.body) {
    var result = [];
    for (var i=0; i< zd.body.length; i++)
      if (zd.body[i].id == id)
        result.push(zd.body[i]);
    return result
  } 
}

exports.getTicketAuthor = function(id){
  if (id && zd.body) {
    var result = [];
    for (var i=0; i< zd.body.length; i++)
      if (zd.body[i].id == id) {
       result.push(zd.body[i].requester_id);
      }
    return result
  } 
  return "unknown";
}

exports.getPageNum = function(){return zd.pageNum};
exports.getPage = function(){return zd.page}; 
//exports.getResponse = function(){return zd.responseList};
//exports.getResult = function(){return zd.resultList};
//exports.getStatus = function(){return zd.statusList};
//exports.getUpdate = function(){return zd.lastUpdate};
exports.getRec = function(){return zd.count};
exports.getCount = function(){
  if (zd.body){
    return zd.body.length;
  }
  return null;
}   
exports.toString = function(){return "Object form benbria ...";};

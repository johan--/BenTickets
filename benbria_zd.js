var zendesk = require('node-zendesk');
var fs = require('fs');

var __zendesk_file = "zd.json";

var interval =  60 * 50; // secs
var client = zendesk.createClient({
    username: 'PUT YOUR USERNAME/EMAIL',
    token: 'PUT YOUR TOKEN HERE',
    remoteUri: 'https://COMPANY.zendesk.com/api/v2',
});

var zd = {statusList:null, body:[],responseList:null,resultList:null,lastUpdate:null};

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
      callback(body);
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
      console.log("ERROR: "+err);
    }
    callback(body);  
  });
}

var n = 1;

var update = function(){
  console.log("..." + n++); 
  client.tickets.list(function (err, statusList, body, responseList, resultList) {
    if (err) {
      console.log(err);
      return;
    }
    zd.body = body;
    zd.responseList = responseList;
    zd.resultList = resultList;
    zd.lastUpdate = new Date();
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

exports.getUser = function(id){
  if (id && zd.user){
    var result = '';
    for(var i=0; i< zd.user.length; i++) {
      if (zd.user[i].id == id) {
        result = zd.user[i].details;
      }
    }
  } 
  return result;
} 

  
exports.getFields = function(id){
  if (id && zd.body) {
    var result = [];
    for (var i=0; i<zd.body.length; i++) {
      if (zd.body[i].id == id) {
        for (var j=0; j<3; j++){
          result.push(zd.body[i].fields[j].value);
        }
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


exports.getResponse = function(){return zd.responseList};
exports.getResult = function(){return zd.resultList};
exports.getStatus = function(){return zd.statusList};
exports.getUpdate = function(){return zd.lastUpdate};
exports.getCount = function(){
  if (zd.body){
    return zd.body.length;
  }
  return null;
}   
exports.toString = function(){return "Object form benbria ...";};

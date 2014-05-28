var fs = require('fs');

var __file; 

exports.init = function(db_file){
	__file = __dirname + "/" + db_file;
	try {
	  exports.db = JSON.parse(fs.readFileSync(__file, 'utf8'));
    } catch(err) {
	  exports.db = {};
  };
  setInterval( function(){
    fs.writeFile(__file, JSON.stringify(exports.db, null, 2), 
    function(err) {
      if(err) console.log(err)
      else console.log("... saving of " + __file );
  })}, 5*30*10); 
};


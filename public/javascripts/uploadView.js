
var updateIfl = function(){
	var input = $("#ifl input:last-child");
    input.hide();
    input.removeAttr('id');
	var file = input.get(0).files[0];
	var new_input = $("<input/>").attr('name','data').attr('style',"display:none").attr('id','ii');
	new_input.attr('type','file').attr('onchange','updateIfl()').attr('class','file');
	$("#ifl").append(new_input);

	var ul = $('#view_ifl');
	var li = $('<li/>');
	li.text(file.name);
	//var btn = $("<span> X </span>");
	var btn = $("<span class='link'><img src='img/icons/delete-icon.png' class='view'/> Remove</span>");
	li.append(btn);
	ul.append(li);
	btn.click(function(){
		input.remove();
		li.remove();
	});
	
}

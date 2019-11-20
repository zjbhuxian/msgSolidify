var reg_method_req = /^(\w+\s)((?=sip:)|(?=tel:)).*?/gi;
var reg_method_rep = /^SIP\/2.0\s([\d]{3}).*?/gi;
var reg_via = /Via:(.*)/gi;
var reg_from = /From:(.*)/gi;
var reg_to = /To:(.*)/gi;
var reg_callid = /Call-ID:(.*)/gi;
var reg_cseq = /CSeq:(.*)/gi;
var reg_contact= /Contact:(.*)/gi;
var reg_maxforwards = /Max-Forwards:(.*)/gi;
var reg_route = /.*\nRoute:(.*)/gm;
var reg_recordroute = /Record-Route:(.*)/gi;
var reg_path = /Path:(.*)/gi;
var reg_contenttype = /Content-Type:(.*)/gi;
var reg_contentlen = /Content-Length:(.*)/gi;
var reg_allow = /Allow:(.*)/gi;
var reg_supported = /Supported:(.*)/gi;
var reg_sessionexpires = /Session-Expires:(.*)/gi;
var reg_minse= /Min-SE:(.*)/gi;
var reg_useragent = /User-Agent:(.*)/gi;
var reg_allow = /Allow:(.*)/gi;
var reg_require = /Require:(.*)/gi;

var sipFormat = function (reg, rawMsg)
{
	var list = [];
	var result = [];
	do {
		result = reg.exec(rawMsg);
		result && list.push(result[1].trim());
	}while(result);

	return list;
};

/**
 * Just fetch the first element in array
 */
var fixResult_one = function (arr)
{
	if(!arr || !Array.isArray(arr) || arr.length == 0)return "";
	return arr[0];
}

// Return null or array object
var fixResult_arr = function (arr)
{
	if(!arr || !Array.isArray(arr))return null;

	var result = "";
	arr.forEach(function(item){
		result += item;
	});
	return result;
}

var sipFormat_handle = function (rawMsg)
{
	if(!rawMsg || rawMsg == "")return null;
	var obj = {};
	var list = [];
	var result = [];

	//reg_method
	obj.sip_name = fixResult_one(sipFormat(reg_method_req, rawMsg));
	if(obj.sip_name == ""){
		obj.sip_name = fixResult_one(sipFormat(reg_method_rep, rawMsg));
	}
	//reg_via 
	obj.h_via1 = fixResult_arr(sipFormat(reg_via, rawMsg));
	//reg_from
	obj.from = fixResult_one(sipFormat(reg_from, rawMsg));
	//reg_to
	obj.to = fixResult_one(sipFormat(reg_to, rawMsg));
	//reg_callid
	obj.callid = fixResult_one(sipFormat(reg_callid, rawMsg));
	//reg_cseq
	obj.cseq = fixResult_one(sipFormat(reg_cseq, rawMsg));
	//reg_contact
	obj.contact = fixResult_one(sipFormat(reg_contact, rawMsg));
	//reg_maxforword
	obj.maxforwards = fixResult_one(sipFormat(reg_maxforwards, rawMsg));
	//reg_route 
	obj.route = fixResult_arr(sipFormat(reg_route, rawMsg));
	//reg_recordroute
	obj.recordroute = fixResult_arr(sipFormat(reg_recordroute, rawMsg));
	//reg_path
	obj.path = fixResult_arr(sipFormat(reg_path, rawMsg));
	//reg_contenttype
	obj.contenttype = fixResult_one(sipFormat(reg_contenttype, rawMsg));
	//reg_contentlen
	obj.contentlen = fixResult_one(sipFormat(reg_contentlen, rawMsg));
	//reg_allow 
	obj.allow = fixResult_one(sipFormat(reg_allow, rawMsg));
	//reg_supported
	obj.supported = fixResult_one(sipFormat(reg_supported, rawMsg));
	//reg_session-expires
	obj.sessionexpires = fixResult_one(sipFormat(reg_sessionexpires, rawMsg));
	//reg_minse
	obj.minse = fixResult_one(sipFormat(reg_minse, rawMsg));
	//reg_useragent
	obj.useragent = fixResult_one(sipFormat(reg_useragent, rawMsg));
	//reg_allow 
	obj.allow = fixResult_one(sipFormat(reg_allow, rawMsg));
	//reg_required
	obj.require = fixResult_one(sipFormat(reg_require, rawMsg));
	return obj;
};

var isJsonObj = function (obj)
{
	var isJson = typeof(obj) == "object" && Object.prototype.toString.call(obj).toLowerCase() == "[object object]" && !obj.length; 
	//console.log(obj+"JSON?"+isJson);
	return isJson;
}

var sipFormat_ast = function(msg)
{
	var json = JSON.parse(msg);
	var sip = null;
	var sip_content = null;

	if(json && json.sip != 'undefined'){
		sip = JSON.parse(json.sip);
	}
	if(sip && sip.sip_content != 'undefined'){
		sip_content = sip.sip_content;
	}

	//console.log(sip_content);
	return sipFormat_handle(sip_content);
}

var sipFormat_osips = function(msg)
{
	return sipFormat_handle(msg);
}

module.exports = {sipFormat_ast, sipFormat_osips};

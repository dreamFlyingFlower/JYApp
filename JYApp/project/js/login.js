$(function() {
	/*---------------全局变量 start---------------*/
	var first = null;							//监听物理返回键的按键次数
	/*---------------全局变量 end---------------*/

	//	mui模块
	function muiInit(){
		if(window.plus){
			plusReady();
		}else{
			document.addEventListener('plusready',plusReady,false);
		}
	}

	//监听手机物理返回键,在本页面返回不会返回上一页,只会退出
	function plusReady(){
		if ('Android' == plus.os.name) {
		    mui.back = function() {
		        if (!first) {
		            first = new Date().getTime();
		            mui.toast('再按一次退出应用');
		            setTimeout(function() {
		                first = null;
		            }, 1000);
		        } else {
		            if (new Date().getTime() - first < 1000) {
		                plus.runtime.quit();
		            }
		        }
		    };
		}
	}
	/*-----------------mui模块end----------------------*/


	//初始化
	function init() {
		//检查记住密码和区域
		checkRememberLog();
		muiInit();
	}

	/*---------------事件绑定 start---------------*/
	function bindEvent() {
		//选择区域
		$(".login-region").parent().click(function(){
			window.location.href = "region.html";
		});
		//登录
		$(".login").click(function(){
			login();
		});
		//帐号切换,未使用
		$("#change").click(function(){
			change();
		});
	}
	/*---------------事件绑定 end---------------*/

	//检查记住密码和区域
	function checkRememberLog(){
		//填充帐号密码
		var rememberLog = localStorage.getItem("rememberLog");
		if(rememberLog){
			var rememberInfo = JSON.parse(rememberLog);
			if(rememberInfo && rememberInfo !=="undefined" && rememberInfo.auto){
				$('#usr').val(rememberInfo.usr);
				$('#pwd').val(rememberInfo.pwd);
				$("#remember").prop("checked",true);
				login();
			}else if(!rememberInfo.auto){
				$("#usr").val("");
				$("#pwd").val("");
				$("#remember").prop("checked",false);
				localStorage.removeItem("rememberLog");
			}
		}
		//默认填充区域
		var defaultRegion = {
			"region":"hubei01",
			"regionText":"湖北1区"
		};
		//填充区域
		var region = sessionStorage.getItem("region");
		var localRegion = JSON.parse(localStorage.getItem("region"));
		if(!localRegion || localRegion === "undefined"){
			localRegion = defaultRegion;
		}
		if(region && region !== undefined && region !== "undefined" ){
			var regionText = sessionStorage.getItem("regionText");
			$("#region").val(regionText);
			sessionStorage.setItem("unique",region);
		}else if(localRegion && localRegion !== undefined && localRegion !== "undefined"){
			$("#region").val(localRegion.regionText);
			sessionStorage.setItem("unique",localRegion.region);
		}
		//消除session以免误操作
        sessionStorage.removeItem("region");
		sessionStorage.removeItem("regionText");
	}

	//登录
	function login(){
		var usr = $('#usr').val();
		var pwd = $('#pwd').val();
		var unique = sessionStorage.getItem("unique");
		if(!unique){
			mui.toast("请选择区域");
			return;
		}
		if(!usr || !pwd){
	        mui.toast("登录名或密码不能为空");
	        return;
	    }

		var mask = mui.createMask().show();
	    $.post($.domain(unique),{ api:'login',usr: usr, pwd: pwd },
	    function (Result) {
	    	mask.close();
	        var result = JSON.parse(Result);
	        if (result.success) {
	            var data = result.data;
	            if(window.plus){
	            	plus.storage.setItem("UserInfo",JSON.stringify(data));
	            }
	            sessionStorage.setItem("UserInfo",JSON.stringify(data));
	        	if(data && data.approve){
	        		if(window.plus){
	            		plus.storage.setItem("approve",$.approve(data.approve));
		            }
		            sessionStorage.setItem("approve",$.approve(data.approve));
		            if("hubei01" === unique){
		            	window.location.href = "index.html";
		            }else if("hubei06" === unique){
		            	window.location.href = "trailMonitor.html";
		            }
	        	}
	        	rememberLog(usr,pwd);
	        } else {
	            alert("登录名或密码错误");
	        }
	    });
	}

	//记住密码
	function rememberLog(usr,pwd){
		if($("#remember").prop("checked")){
			var rememberLog = {
				auto:true,
				usr:usr,
				pwd:pwd
			};
			localStorage.setItem("rememberLog",JSON.stringify(rememberLog));
		}else{
			localStorage.setItem("rememberLog","");
		}
	}

	//帐号切换,需接入等三方登录
	function change(){
		$("#usr").val("");
		$("#pwd").val("");
		$("#remember").prop("checked",false);
	}

	//初始化
	init();
	//绑定事件
	bindEvent();
});
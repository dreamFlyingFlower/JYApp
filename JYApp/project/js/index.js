$(function () {
    //获得权限信息
    var approve = sessionStorage.getItem("approve");
    var user = JSON.parse(sessionStorage.getItem("UserInfo"));
    var first = null;									//监听物理返回键的按键次数

	function init(){
		loginCheck();
		approveControl();
	}

	//登陆验证
	function loginCheck(){
		if(user){
			$(".index_user").text(user.NickName);
		}else{
			mui.toast("登录超时");
			setTimeout(function(){
				window.location.href = "login.html";
			},2000);
			return;
		}
	}
    //权限验证
    function approveControl() {
        $.each($(".mui-content li"), function (index) {
            $(this).click(function () {
                if ("all" === $(this).attr("data-choice") && "ct" !== approve) {
                    window.location.href = $(this).find("a").attr("href");
                }else if (approve === $(this).attr("data-choice")) {
                    window.location.href = $(this).find("a").attr("href");
                } else {
                    mui.alert("权限不足");
                    return false;
                }
            });
        });
    }

	function bindEvent(){
		mui("nav").on("tap", "a", function () {
		    window.location.href = $(this).attr("href");
		});
	}

	if(window.plus){
		plusReady();
	}else{
		document.addEventListener('plusready',plusReady,false);
	}

    //监听手机物理返回键,在本页面返回不会返回上一页,只会退出
	function plusReady(){
		plus.navigator.closeSplashscreen();
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

	init();
	bindEvent();
});
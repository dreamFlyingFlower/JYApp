$(function () {
    var userInfo = JSON.parse(sessionStorage.getItem("UserInfo"));
    var first = null;

    /*------------------mui模块 start--------------------*/
    mui.init({
        swipeBack: true //启用右滑关闭功能
    });
    //初始化单页面
    var viewApi = mui('#app').view({
        defaultPage: '#setting'
    });
    //初始化单页的区域滚动
    mui('.mui-scroll-wrapper').scroll();
    //返回上级页面
    var view = viewApi.view;
    mui.ready(function () {
        //处理view的后退与webview后退
        mui.back = function () {
            if (viewApi.canBack()) { 				//如果view可以后退，则执行view的后退
                viewApi.back();
            } else { 								//执行webview后退
                if ('Android' == plus.os.name) {
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
				}
            }
        };
        //监听页面切换事件方案1,通过view元素监听所有页面切换事件，目前提供pageBeforeShow|pageShow|pageBeforeBack|pageBack四种事件(before事件为动画开始前触发)
        //第一个参数为事件名称，第二个参数为事件回调，其中e.detail.page为当前页面的html对象
        view.addEventListener('pageBeforeShow', function (e) {
            //				console.log(e.detail.page.id + ' beforeShow');
        });
        view.addEventListener('pageShow', function (e) {
            //				console.log(e.detail.page.id + ' show');
        });
        view.addEventListener('pageBeforeBack', function (e) {
            //				console.log(e.detail.page.id + ' beforeBack');
        });
        view.addEventListener('pageBack', function (e) {
            //				console.log(e.detail.page.id + ' back');
        });
    });
	/*------------------mui模块 end--------------------*/

    function init(){
    	mui("#ConfigMonitorTime").numbox().setValue(30);
        userShow();
    }

    /*------------------事件绑定 --------------------*/
    function bindEvent() {
        //退出
        mui('#setting').on('tap', '#logout', function () {
            mui.confirm("是否确认退出", "提示", ["是", "否"], function (e) {
                if (0 === e.index) {
                	sessionStorage.clear();
                    var autoLogin = localStorage.getItem("rememberLog");
                    if(autoLogin){
                        var autoMessage = JSON.parse(autoLogin);
                        autoMessage.auto = false;
                        localStorage.setItem("rememberLog",JSON.stringify(autoMessage));
                    }
                	window.location.href = "login.html";
                }
            });
        });

        mui("nav").on("tap", "a", function () {
            window.location.href = $(this).attr("href");
        });

        $("#ConfigMonitorTime").click(function(){
        	sessionStorage.setItem("ConfigMonitorTime",mui("#ConfigMonitorTime").numbox().getValue());
        });
    }
    /*------------------事件绑定 end--------------------*/

    function userShow() {
        $("#user").text(userInfo.NickName);
    }

    init();
    bindEvent();
});
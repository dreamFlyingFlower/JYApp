$(function () {
    //全局变量
    var unique = sessionStorage.getItem("unique");				//用户唯一标识
    var domain = $.domain(unique);
    var user = JSON.parse(sessionStorage.getItem("UserInfo"));
    var detail = JSON.parse(sessionStorage.getItem("driverDetail"));    //详情数据
    var approve = sessionStorage.getItem("approve");                  //权限
    //全局变量 end

    //初始化
    function init() {
    	if(!unique){
			mui.toast("用户唯一标识不存在,请重新登录");
			window.location.href = "login.html";
			return;
		}
        dataShow();
        lookPicture(detail.Id);
    }

    function bindEvent() {
        $("#look").click(function () {
            $("#cover").show();
            $("#showImg").show();
            return false;
        });
        $(document).click(function () {
            $("#cover").hide();
            $("#showImg").hide();
        });
    }

    function dataShow() {
        if (!detail) {
            detail = JSON.parse(sessionStorage.getItem("driverDetail"));
        }
        $("#taskForm").form("load", detail);
        $("#InsertId").textbox("setText", user.NickName);
        $("#Name").textbox("setText", detail.Name + "(" + detail.JobTitle + ")");
    }

    function lookPicture(id) {
        var imgUrl = domain + "?api=getAttachbyId&Id=" + id + "&" + new Date().getTime();
        var img = document.getElementsByTagName('img')[0];
        img.src = imgUrl;
    }

    //初始化
    init();
    //事件绑定
    bindEvent();
});
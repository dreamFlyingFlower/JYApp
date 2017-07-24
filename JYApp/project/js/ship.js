$(function () {
    //全局变量
    var unique = sessionStorage.getItem("unique");						//用户唯一标识
    var domain = $.domain(unique);
    var user = JSON.parse(sessionStorage.getItem("UserInfo"));
    var detail = JSON.parse(sessionStorage.getItem("taskDetail"));    //详情数据
    var approve = sessionStorage.getItem("approve");                  //权限
    //全局变量 end


    function init() {
    	if(!unique){
			mui.toast("用户唯一标识不存在,请重新登录");
			window.location.href = "login.html";
			return;
		}
        approveControl();
    }

    //事件绑定
    function bindEvent() {
        $("#save").click(function () {
            save();
        });
        //选择车牌号时自动填充内部编号以及车台长
        $("#VehicleNum").combobox({
        	url:domain + '?api=getVehicleInfo',
            onSelect: function (row) {
                $("#Driver1").textbox("setValue", row.UserDefine1);
                $("#Driver2").textbox("setValue", row.UserDefine2);
                $("#Driver3").textbox("setValue", row.UserDefine3);
                //车辆状态为派遣中时提示
                if("派遣中" === row.State){
                	$.messager.confirm("注意",
                	"车辆"+row.FInnerId + "以派任务("+row.TaskId+")<br>开盘时间:"
                	+row.PlanBeginTime+"<br>收盘时间:"+row.PlanEndTime
                	+ "<br>是否确定继续派车?",
                	function(r){
                		if(!r){
                			$("#VehicleNum").combobox("setValue","");
                			$("#VehicleNum").combobox("setText","");
                		}
                	});
                }
            }
        });
        mui(document).on('tap','#DisTime',function(e){
			var picker = new mui.DtPicker();
			picker.show(function(rs){
				document.getElementById("DisTime").value = rs.text;
				picker.dispose();
			});
		});
    }
    //权限控制,数据展示
    function approveControl() {
        if ("ch" !== approve) {
            //window.location.href = "group.html";
        }
        if (!detail) {
            detail = JSON.parse(sessionStorage.getItem("taskDetail"));
        }
        //数据展示处理
        var shipData = {};
        shipData.TaskId = detail.Id;
        shipData.Name = detail.Name;
        shipData.Rent =  false;
        shipData.PlanTaskTotal = detail.PlanTaskTotal;
        shipData.PlanBeginTime = detail.PlanBeginTime;
        shipData.PlanEndTime = detail.PlanEndTime;
        shipData.VehicleType = detail.VehicleType;
        shipData.SiteName = detail.SiteName;
        shipData.InsertId = user.usr;
        $("#dataForm").form("load", shipData);
        $("#InsertId").textbox("setText",user.NickName);
    }
    //新增报单
    function save() {
    	var disTime = $("#DisTime").val();
    	if(!disTime){
    		$.messager.alert("提示","派车时间不能为空");
    		return;
    	}
        $("#dataForm").form("submit", {
            url: domain + '?api=SYZG_InsertShip&usr=' + user.usr + '&pwd=' + user.UUIDPwd + "&nickName" + user.NickName,
            success: function (Result) {
                var result = JSON.parse(Result);
                if (result.success) {
                    $.messager.alert("提示", result.message);
                    window.location.href = "index.html";
                } else {
                    $.messager.alert("提示", result.message);
                }
            }
        });
    }

    //初始化
    init();
    //事件绑定
    bindEvent();
});
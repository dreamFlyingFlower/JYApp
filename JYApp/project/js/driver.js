$(function () {
    //全局变量
    var unique = sessionStorage.getItem("unique");				//用户唯一标识
    var domain = $.domain(unique);
    var user = JSON.parse(sessionStorage.getItem("UserInfo"));
    var approve = sessionStorage.getItem("approve");            //权限
    var driverDetail = JSON.parse(sessionStorage.getItem("driverDetail"));
    //全局变量 end


    function init() {
    	if(!unique){
			mui.toast("用户唯一标识不存在,请重新登录");
			window.location.href = "login.html";
			return;
		}
        approveControl();
        getData();
    }

    //事件绑定
    function bindEvent() {
        $("#save").click(function () {
            save();
        });
        mui("form").on('tap','#ReportTime',function(e){
			var picker = new mui.DtPicker();
			picker.show(function(rs){
				document.getElementById("ReportTime").value = rs.text;
				picker.dispose();
			});
		});
    }
    //权限控制
    function approveControl() {
        if ("ct" !== approve) {
            $("#save").prop("disabled",true);
        }
    }
    //数据获取
    function getData() {
    	if(!driverDetail){
    		driverDetail = JSON.parse(sessionStorage.getItem("driverDetail"));
        }
        var data = dataFilter(driverDetail);
        $("#carManagerForm").form("load", data);
    }
    //数据择取
    function dataFilter(Data) {
        var driverData = {};
        driverData.TaskId = Data.Id;
        driverData.ShipId = Data.ShipId;
        driverData.Name = Data.Name + "("+ Data.JobTitle+")";
        driverData.PlanTaskTotal = Data.PlanTaskTotal+"方";
        driverData.VehicleType = Data.VehicleType;
        driverData.FInnerId = Data.FInnerId;
        driverData.SiteName = Data.SiteName;
        driverData.DeliverTime = Data.DeliverTime;
        driverData.DriverShip = Data.DriverShip;
        driverData.InsertId = user.usr;
        return driverData;
    }
    //新增报单
    function save() {
        var OrderId = $("#OrderId").val();
        var reportTime = $("#ReportTime").val();
        if (!OrderId) {
            $.messager.alert("提示","手撕单号不能为空");
            return;
        }
        if(!reportTime){
        	$.messager.alert("提示","开单日期不能为空");
            return;
        }
        $("#carManagerForm").form("submit", {
            url: domain + '?api=SYZG_InsertReport&usr=' + user.usr + '&pwd=' + user.UUIDPwd,
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
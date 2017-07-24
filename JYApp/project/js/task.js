$(function () {
    //全局变量
    var unique = sessionStorage.getItem("unique");			//用户唯一标识
    var domain = $.domain(unique);
    var user = JSON.parse(sessionStorage.getItem("UserInfo"));
    var url = "";                           				//ajax请求后台地址，根据保存或修改改变
    var approve = sessionStorage.getItem("approve");      	//权限
    //全局变量 end


	if(window.plus){
		plusReady();
	}else{
		document.addEventListener('plusready',plusReady,false);
	}
    
    //监听手机物理返回键,在本页面返回不会返回上一页,只会退出
	function plusReady(){
		if ('Android' == plus.os.name) {
		    mui.back = function() {
		    	history.go(-1);
		    }
		}
	}

    //初始化
    function init() {
    	if(!unique){
			mui.toast("用户唯一标识不存在,请重新登录");
			window.location.href = "login.html";
			return;
		}
        add();
    }

    //新增任务
    function add() {
        $('#taskForm').form('reset');
        $('#InsertId').textbox('setValue', user.usr);
        $('#InsertId').textbox('setText', user.nickName);
        $('#ModiId').textbox('setValue', user.usr);
        //权限控制,只有业务员有新增权限,其他只有查看权限
        if (approve === 'crd') {
            $(".operate").show();
        } else {
            $(".operate").hide();
        }
        url = domain+'?api=SYZG_InsertTask&usr=' + user.usr + '&pwd=' + user.UUIDPwd;
    }
    //easyui事件邦定
    $("#Name").combobox({
    	url:domain+"?api=getClientbyId&usr="+user.usr,
        onSelect: function () {
            getCustomInfo();
        }
    });
    //选择客户名称时连带填充相关信息
    function getCustomInfo() {
        $.post(domain, { api: "getContactbyId", Client: $("#Name").combobox("getValue") }, function (Result) {
            if (Result) {
                var result = JSON.parse(Result);
                $("#Client").textbox("setValue", result[0].Id);
                $("#Contact").textbox("setValue", result[0].master);
                $("#Tel").textbox("setValue", result[0].MasterTel);
            }
        });
    }
    //保存任务或修改任务
    function save() {
    	var beginTime = $("#PlanBeginTime").val();
    	var endTime = $("#PlanBeginTime").val();
    	if(!beginTime || !endTime){
    		$.messager.alert("提示","请选择时间");
    		return;
    	}
        $("#taskForm").form("submit", {
            url: url,
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

    //事件绑定
    function bindEvent() {
        //申请提交任务单
        $("#save").click(function () {
            save();
        });
        //取消任务单
        $("#cancel").click(function () {
            $("#taskForm").form("reset");
        });
        //回退
        $(".m-back").click(function(){
        	history.go(-1);
        });
        mui(document).on('tap','#PlanBeginTime,#PlanEndTime',function(e){
			var target = e.target;
			var picker = new mui.DtPicker();
			if(target.id === "PlanBeginTime"){
				picker.show(function(rs){
					document.getElementById("PlanBeginTime").value = rs.text;
					picker.dispose();
				});
			}else if(target.id === "PlanEndTime"){
				picker.show(function(rs){
					document.getElementById("PlanEndTime").value = rs.text;
					picker.dispose();
				});
			}
		});
    }

    //初始化
    init();
    //事件绑定
    bindEvent();
});
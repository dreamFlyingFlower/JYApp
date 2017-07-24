$(function () {
    //全局变量
    var unique = sessionStorage.getItem("unique");						//用户唯一标识
    var domain = $.domain(unique);
    var user = JSON.parse(sessionStorage.getItem("UserInfo"));
    var detail = JSON.parse(sessionStorage.getItem("taskDetail"));    	//详情数据
    var updateDetail = {};                              				//详情对象需要进行修改的原值
    var approve = sessionStorage.getItem("approve");                  	//权限
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
		    };
		}
	}

    function init() {
    	if(!unique){
			mui.toast("用户唯一标识不存在,请重新登录");
			window.location.href = "login.html";
			return;
		}
    	//数据展示
    	showData();
        //权限控制
        approveContorl();
    }

    function bindEvent() {
        //业务员申请关闭
        $("#closeit").click(function () {
            $.messager.confirm('请注意', '确定申请关闭吗?', function (r) {
                if (r) {
                	$(this).attr("disabled", true);
                    detail.Closed = 1;
                    detail.Valid = updateDetail.Valid;
                    detail.State = updateDetail.State;
                    apply();
                }
            });
        });
        //申请通过
        $("#applyPass").click(function () {
            $.messager.confirm('提示', '确定申请通过吗?', function (r) {
                if (r) {
                	$(this).attr("disabled", true);
                    detail.Valid = true;
                    detail.State = updateDetail.State;
                    apply();
                }
            });
        });
        //申请拒绝
        $("#applyReject").click(function () {
            $.messager.confirm('提示', '确定申请驳回吗?', function (r) {
                if (r) {
                	$(this).attr("disabled", true);
                    detail.Valid = false;
                    detail.State = updateDetail.State;
                    apply();
                }
            });
        });
        //审核通过撤销
        $("#closePass").click(function () {
            $.messager.confirm('提示', '确定撤销吗?', function (r) {
                if (r) {
                    $(this).attr("disabled", true);
                    detail.Closed = 2;
                    detail.Valid = false;
                    detail.State = updateDetail.State;
                    apply();
                }
            });
        });
        //审核驳回撤销
        $("#closeReject").click(function () {
            $.messager.confirm('提示', '确定驳回吗?', function (r) {
                if (r) {
                    $(this).attr("disabled", true);
                    detail.Closed = 0;
                    detail.State = 0;
                    detail.Valid = true;
                    apply();
                }
            });
        });
        //回退
        $(".m-back").click(function(){
        	history.go(-1);
        });
    }

    //数据展示
    function showData(){
    	if (!detail) {
            detail = JSON.parse(sessionStorage.getItem("taskDetail"));
        }
    	$.ajax({
    		type: "post",
            url: domain,
            data: {
                api: "SYZG_TaskInfo",
                usr: user.usr,
                pwd: user.UUIDPwd,
                status:detail.State,
                taskId:detail.Id,
                page: 1,
                rows: 10
            },
            success:function(Result){
            	if(Result){
            		var result_tmp = JSON.parse(Result);
            		if(result_tmp.success){
	            		var result = result_tmp.data.rows[0];
	            		detail = result;
	            		//此处保留原detail值便于其他更新操作时,能够和数据库字段对应
				        updateDetail.Valid = result.Valid;
				        updateDetail.State = result.State;
				        updateDetail.RentType = result.RentType;
				        updateDetail.PlanTaskTotal = result.PlanTaskTotal;
				        updateDetail.RentUnitPrice = result.RentUnitPrice;
				        updateDetail.Rent = result.Rent;
				        updateDetail.ShipState = result.ShipState;
				        //页面显示值
				        detail.Valid = result.Valid  ? "通过" : "驳回";
				        detail.State = Dictionary.TaskState[result.State];
				        detail.RentType = Dictionary.RentType[result.RentType];
				        detail.PlanTaskTotal = detail.PlanTaskTotal + "方";
				        detail.RentUnitPrice = detail.RentUnitPrice + "元/方";
				        detail.Rent = Dictionary.Rent[result.Rent];
				        detail.ShipState = Dictionary.ShipState[result.ShipState];
				        $("#taskForm").form("load", result);
				        $("#InsertId").textbox("setText", result.Business);
				        $("#Name").textbox("setText", detail.Name + "(" + result.JobTitle + ")");
            		}else{
            			$.messager.alert("提示",result_tmp.message);
            		}
            	}else{
            		$.messager.alert("提示","无数据");
            	}
            }
    	});
    }

    //权限控制,数据展示
    function approveContorl() {
        if ("crd" === approve) {                    //业务员
            if ("0" === detail.State && "0" === detail.Closed) {
                $(".business").show();
            }
        } else if ("srd" === approve) {             //审核员
            if (detail.Closed === "1") {
                $(".check_close").show();
            }else if(detail.Valid && "0" === detail.State){
                $(".check").show();
            }
        } else if ("ch" === approve) {              //调度

        } else if ("ct" === approve) {              //司机

        }
        //显示派车信息和报单信息
        if("1" === detail.State){
        	$(".ship").show();
        }else if("2" === detail.State){
        	$(".ship").show();
        	$(".report").show();
        }
    }

    //申请关闭,申请通过,申请驳回
    function apply() {
    	detail.RentType = updateDetail.RentType;
        detail.PlanTaskTotal = updateDetail.PlanTaskTotal;
        detail.RentUnitPrice = updateDetail.RentUnitPrice;
        detail.Rent = updateDetail.Rent;
        detail.ShipState = updateDetail.ShipState;
        $.ajax({
            url: domain + '?api=SYZG_UpdateTask&usr=' + user.usr + '&pwd=' + user.UUIDPwd,
            type: "post",
            data: detail,
            success: function (Result) {
                if (Result) {
                    var result = JSON.parse(Result);
                    $.messager.alert("提示", result.message);
                    window.location.href = "index.html";
                } else {
                    $.messager.alert("提示", "系统错误");
                }
            }
        });
    }

	//字典类显示
	var Dictionary={
		TaskState:{
			"0":'待审核',
			"1":"已派车",
			"2":"完成",
			"6":"待派车"
		},
		RentType:{
			"0":"方量",
			"1":"其他"
		},
		//外协否
		Rent:{
			"0":"本部",
			"1":"外协"
		},
		//ship单状态
		ShipState:{
			"0":"接收派车",
			"1":"运输途中",
			"2":"到达工地",
			"3":"开始卸料",
			"4":"结束卸料",
			"5":"回厂途中",
			"6":"回厂"
		}
	};

    init();
    bindEvent();
});
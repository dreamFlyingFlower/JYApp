(function ($) {
    var timeout = 5000;//超时时间,默认5秒
    var WARN = ["紧急报警","超速报警","疲劳驾驶","预警", "GNSS模块发生故障","GNSS天线未接或被剪断",
            "GNSS天线短路", "终端主电源欠压","终端主电源掉电","终端LCD或显示器故障","TTS模块故障",
            "摄像头故障","道路运输证IC卡模块故障","超速预警","疲劳驾驶预警","终端主电源高压",
            "视频丢失报警","视频遮挡报警","当天累计驾驶超时","超时停车","进出区域","进出路线",
            "路段行驶时间不足/过长","路线偏离报警","车辆VSS故障","车辆油量异常","车辆被盗",
            "车辆非法点火","车辆非法位移","碰撞报警","SD卡异常","非法开门报警"];
    var HttpList = {
    	"hubei01":"http://139.224.187.58:5953/api.ashx",		//三一
    	"hubei06":"http://139.224.65.72:5953/api.ashx"			//HNT,默认进监控
    };
    $.fn.extend();
    $.extend({
    	domain:function(unique){
    		if(unique){
    			return HttpList[unique];
    		}else{
    			return "";
    		}
    	},
        loginInfo: function (user) {
            $.ajax({
                url: "api.ashx",
                data: { api: 'loginInfo' },
                async: false,
                success: function (Result) {
                    var result = JSON.parse(Result);
                    if (result.success) {
                        var oLoginInfo = result.data;
                        user.usr = oLoginInfo.usr;
                        user.pwd = oLoginInfo.pwd;
                        user.nickName = oLoginInfo.nickName;
                    } else {
                        alert("登录超时");
                        window.location.href = "/login.html";
                    }
                }
            });
        },
        //针对easyuidatetimebox格式化的昨天时间，根据easyui版本不同，时间的分隔符不同
        yesterday: function () {
            var now = new Date();
            var yes = new Date(now.getTime() - 86400000);
            return yes.toLocaleDateString().replace(/\//g, "-") + " 00:00:00";
        },
        nowday: function (isBegin) {
            var now = new Date();
            if (isBegin) {
                return now.toLocaleDateString().replace(/\//g, "-") + " 00:00:00";
            } else {
                return now.toLocaleDateString().replace(/\//g, "-") + " 23:59:59";
            }
        },
        //表格初始化
        form_init: function () {

        },
        approve:function(param){
            switch(param){
                case "UN17030003": return "crd";                            //业务员
                case "UN17030004": return "srd";					        //审核员
                case "UN17030005": return "ct";								//司机
                case "UN17030006": return "ch";								//调度
                default: return "";
            }
        },
        sessionStorage:function(key,value){
        	if(value && typeof value === "object"){
        		sessionStorage.setItem(key,JSON.stringify(value));
        	}else if(value){
        		sessionStorage.setItem(key,value);
        	}else if(!value){
				return sessionStorage.getItem(key);
        	}
        },
        localStorage:function(key,value){
        	if(value && typeof value === "object"){
        		localStorage.setItem(key,JSON.stringify(value));
        	}else if(value){
        		localStorage.setItem(key,value);
        	}else if(!value){
        		return localStorage.getItem(key);
        	}
        },
        //状态信息
        statusInfo:function(status,type){
        	if(!status || status.length === 0){
        		return;
        	}
        	var statusStr = "";
        	if (status.substring(0, 1) == "1") {//ACC
		        statusStr += "ACC开,";
		    } else {
		        statusStr += "ACC关,";
		    }
		    if (status.substring(1, 2) == "1") {//定位
		        statusStr += "定位,";
		    } else {
		        statusStr += "1D定位,";
		    }
		    if (status.substring(2, 3) == "1") {//纬度
		        statusStr += "南纬,";
		    }
		    if (status.substring(3, 4) == "1") {//经度
		        statusStr += "西经,";
		    }
		    if (status.substring(4, 5) == "1") {//运营状态
		        statusStr += "停运状态,";
		    }
		    if (status.substring(5, 6) == "1") {//加密
		        statusStr += "经纬度已经保密插件加密,";
		    }
		    if (status.substring(6, 7) == "1") {//模式
		        if (status.substring(7, 8) == "1") {
		            statusStr += "双模,";
		        } else {
		            statusStr += "单北斗,";
		        }
		    } else {
		        if (status.substring(7, 8) == "1") {
		            statusStr += "单GPS,";
		        }
		    }
		    if (status.substring(8, 10) == "01") {//载重
		        statusStr += "半载,";
		    } else if (status.substring(8, 10) == "11") {
		        statusStr += "满载,";
		    }
		    if (status.substring(10, 11) == "1") {//油路
		        statusStr += "车辆油路段开,";
		    }
		    if (status.substring(11, 12) == "1") {//电路
		        statusStr += "车辆电路断开,";
		    }
		    if (status.substring(12, 13) == "1") {//车门
		        statusStr += "车门加锁,";
		    }
		    if (status.substring(13,14)=="1") {//门磁前门
		        statusStr += "前门开,";
		    }
		    if (status.substring(14, 15) == "1") {//门磁后门
		        statusStr += "后门开,";
		    }
		    if (status.substring(15, 16) == "1") {//发动机
		        statusStr += "发动机开,";
		    }
		    if (status.substring(16, 17) == "1") {//空调
		        statusStr += "空调开,";
		    }
		    if (status.substring(17,18)=="1") {//刹车
		        statusStr += "刹车,";
		    }
		    if (status.substring(18,19)=="1") {//左转向
		        statusStr += "左转向开,";
		    }
		    if (status.substring(19, 20) == "1") {//右转向
		        statusStr += "右转向开,";
		    }
		    if (status.substring(20, 21) == "1") {//远光灯
		        statusStr += "远光楷,";
		    }
		    if (status.substring(21, 22) == "1" && type === "1") {//正反转
		        if (status.substring(26, 27) == "0") {//正反转状态
		            statusStr += "正转,";
		        }else{//正反转状态
		            statusStr += "反转,";
		        }
		    }
		    if (status.substring(22, 23) == "1") {//震动
		        statusStr += "震动开,";
		    }
		    if (status.substring(23, 24) == "1") {//喇叭
		        statusStr += "喇叭开,";
		    }
		    if (status.substring(24, 25) == "1") {//自定义
		        statusStr += "卸货,";
		    }
		    if (status.substring(25, 26) == "1") {//自定义
		        statusStr += "有效,";
		    }
		    if (status.substring(27, 28) == "1") {//自定义
		        statusStr += "有效,";
		    }
		    if (status.substring(28, 29) == "1") {//蜂鸣器
		        statusStr += "蜂鸣器有效,";
		    }
		    if (status.substring(29, 30) == "1") {//对讲状态
		        statusStr += "对讲状态,";
		    }
		    if (status.substring(30, 31) == "1") {//载货状态
		        statusStr += "重载状态,";
		    }
		    if (statusStr=="") {
		        return "";
		    } else {
		        return statusStr.substring(0, statusStr.length - 1);
		    }
		},
		//报警信息
        warnInfo:function(warnInfo){
        	var indexs = [];
        	for (var i = 0; i <  warnInfo.length; i++) {
        		var index = warnInfo.indexOf("1",i);
        		if(index>=0){
        			indexs.push(WARN[index]);
        			i=index;
        		}else{
        			break;
        		}
        	}
        	return indexs.length > 0 ? indexs.join(",") : "无报警";
        }
    });
})(window.jQuery);
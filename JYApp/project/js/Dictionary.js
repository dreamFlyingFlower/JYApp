/**
 * 字典类,不进入打包
 */
var Dictionary={
	//权限控制
	Approve:{
		"UN17030003": "crd",     	//业务员
        "UN17030004": "srd",	 	//审核员
        "UN17030005": "ct",			//司机
        "UN17030006": "ch"			//调度
	},
	//任务单状态
	TaskState:{
		"0":'待审核',
		"1":"已派车",
		"2":"完成",
		"6":"待派车"
	},
	//租赁方式
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
	},
	//根据方向角度获得中文方法
	Direction: function (param) {
        if (param > 22.5 && param < 90 - 22.5) {
            return "东北";
        }else if (param >= 90 - 22.5 && param <= 90 + 22.5) {
            return "正东";
        }else if (param > 90 + 22.5 && param < 180 - 22.5) {
            return "东南";
        }else if (param >= 180 - 22.5 && param <= 180 + 22.5) {
            return "正南";
        }else if (param > 180 + 22.5 && param < 270 - 22.5) {
            return "西南";
        }else if (param >= 270 - 22.5 && param <= 270 + 22.5) {
            return "正西";
        }else if (param > 270 + 22.5 && param < 360 - 22.5) {
            return "西北";
        }else {
            return "正北";
        }
    }
};

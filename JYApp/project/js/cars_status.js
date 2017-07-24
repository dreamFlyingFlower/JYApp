$(function() {
	/*---------------全局变量 start---------------*/
	var unique = sessionStorage.getItem("unique");				//用户唯一标识
	var domain = $.domain(unique); 									//请求地址url
	var user = JSON.parse(sessionStorage.getItem("UserInfo"));
	var pageAll = 1; 											//全部分页页数
	var pageOnline = 1; 										//在线分页页数
	var pageOffline = 1; 										//离线分页页数
	var pageWarn = 1; 											//报警分页页数
	var pageSize = 10; 											//每页条数
	var geoc = new BMap.Geocoder();
	/*---------------全局变量 end---------------*/

	function init() {
		if(!unique){
			mui.toast("用户唯一标识不存在,请重新登录");
			window.location.href = "login.html";
			return;
		}
		mui.init({
			swipeBack: false,
		});
		getInitData();
		setTimeout(getData(0, true), 300);
		setTimeout(getData(1, true), 400);
		setTimeout(getData(2, true), 500);
		setTimeout(getData(3, true), 600);
	}

	/*---------------事件绑定 start---------------*/
	function bindEvent() {
		$(".mui-table-view").on("click","ul",function() {
			var $this = $(this);
			gotoDetail($this);
		});
	}
	/*---------------事件绑定 end---------------*/

	//下拉事件
	function getInitData() {
		//阻尼系数
		var deceleration = mui.os.ios ? 0.003 : 0.0009;
		mui('.mui-scroll-wrapper').scroll({
			bounce: false,
			indicators: true, //是否显示滚动条
			deceleration: deceleration
		});
		mui.ready(function() {
			//循环初始化所有下拉刷新，上拉加载。
			mui.each(document.querySelectorAll('.mui-slider-group .mui-scroll'), function(index, pullRefreshEl) {
				mui(pullRefreshEl).pullToRefresh({
					up: {
						callback: function() {
							var self = this;
							setTimeout(function() {
								getData(index, false);
								self.endPullUpToRefresh();
							}, 1000);
						}
					}
				});
			});
		});
	}

	//数据获取
	function getData(Index, isFirst) {
		var page = 1;
		if(Index === undefined || Index === "undefined") {
			Index = 0;
		}
		var status = "4";
		if(Index === 0) {				//全部
			status = 4;
			page = pageAll;
		} else if(Index === 1) {		//在线
			status = 1;
			page = pageOnline;
		} else if(Index === 2) {		//离线
			status = 2;
			page = pageOffline;
		} else if(Index === 3) {
			status = 3;
			page = pageWarn;
		}
		$.ajax({
			type: "post",
			url: domain,
			data: {
				api: "getCarsInnerTree",
				usr: user.usr,
				q: "",
				page: page,
				rows: pageSize,
				status: status
			},
			success: function(Result) {
				if(Result) {
					var result = JSON.parse(Result);
					if(result.success) {
						showData(result.data.rows, Index);
						if(0 === Index) {
							pageAll++;
						} else if(1 === Index) {
							pageOnline++;
						} else if(2 === Index) {
							pageOffline++;
						} else if(3 === Index) {
							pageWarn++;
						}
						$("#sliderSegmentedControl").find("a").eq(Index).find("span").text(result.data.total);
					} else {
						if(isFirst) {
							if("无数据" !== result.message) {
								mui.toast(result.message);
							} else {
								$("#sliderSegmentedControl").find("a").eq(Index).find("span").text(0);
							}
						}
					}
				} else {
					mui.toast("系统异常!");
				}
			}
		});
	}

	//数据展示
	function showData(data, _index) {
		if(data.length === 0) {
			return;
		}
		var html = "";
		var count = 0;
		var leng = data.length;
		for(var i = 0; i < leng; i++) {
			(function(m){
				var ths = data[m];
				geoc.getLocation(new BMap.Point(ths.Lng,ths.Lat),function(result){
					count++;
					if(!ths.Id){
						html += '<li class="mui-table-view-cell" style="border-bottom:1px solid #007aff "><ul>';
						html += '<li class="mui-ellipsis">车牌号:&nbsp;<a href="javascript:void(0);">' + ths.FInnerId+ '</a><mark style="display:none;">'+ ths.VehicleId+'</mark>';
						html += '<li>无定位数据</li>';
						html += '</ul></li>';
					}else{
						html += '<li class="mui-table-view-cell" style="border-bottom:1px solid #007aff "><ul>';
						html += '<li class="mui-ellipsis">车牌号:&nbsp;<a href="javascript:void(0);">' + ths.FInnerId+ '</a><mark style="display:none;">'+ ths.VehicleId+'</mark>';
						if(ths.Online === "1"){
							html += '<span class="cars_online mui-green">在线</span></li>';
						}else if(ths.Online === "0"){
							html += '<span class="cars_online color-gray">离线</span></li>';
						}
						html += '<li class="mui-ellipsis">速度:&nbsp;<span >'+ ths.Speed+'</span>km/h</li>';
						html += '<li class="mui-ellipsis">方向:&nbsp;<span >'+ Direction(ths.Direction)+'</span></li>';
						html +=	'<li class="mui-ellipsis">时间:&nbsp;<span >'+ ths.RecordTime+'</span></li>';
						html += '<li class="mui-ellipsis">地址:&nbsp;<span >'+ result.address+'</span></li>';
						html += '<li class="mui-ellipsis">状态:&nbsp;<span>' + $.statusInfo(ths.StatusInfo,ths.VehicleType) + '</span></li>';
						if(3 === _index){
							html += '<li class="mui-ellipsis">报警:&nbsp;<span >'+ $.warnInfo(ths.WarnInfo)+'</span></li>';
						}
						html += '</ul></li>';
					}
				});
			})(i);
		}
		var interval = setInterval(function(){
			if(count === leng){
				clearInterval(interval);
				$.each($(".mui-slider-group .mui-scroll"), function(index) {
					if(_index === index) {
						var that = $(this);
						that.find(".mui-table-view").append(html);
						//数据绑定.未使用
						//$.each(that.find(".mui-table-view"), function (index) {
						//	$(this).data($(this).find("li").eq(0).find("a").eq(0).text(), data[index]);
						//});
					}
				});
			}
		},100);
	}

	//跳转到详情页
	function gotoDetail(ths) {
		var car = ths.find("li").eq(0).find("mark").text();
		localStorage.setItem("historySearch"+user.usr + unique, car + "|carStatus");
		window.location.href = "trailMonitor.html";
	}

	//方向
	function Direction(param) {
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

	init();
	bindEvent();
});
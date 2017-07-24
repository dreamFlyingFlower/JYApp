$(function () {
    //全局变量
    var unique = sessionStorage.getItem("unique");				//用户唯一标识
    var domain = $.domain(unique);
    var user = JSON.parse(sessionStorage.getItem("UserInfo"));
    var pageFinish = 1;                     //已报单分页页数
    var pageWork=1;							//未报单分页页数
    var pageSize = 10;                      //分页条数
    //全局变量 end

    mui.init({
        swipeBack: true //启用右滑关闭功能
    });

    function init() {
    	if(!unique){
			mui.toast("用户唯一标识不存在,请重新登录");
			window.location.href = "login.html";
			return;
		}
        getInitData();
        setTimeout(function(){
        	getData(0,true)
        }, 100);
        setTimeout(function(){
        	getData(1,true);
        },200);
    }

    function bindEvent() {
        //点击详情
        $(".mui-table-view").on("click",".mui-table-view-cell",function () {
            var ths = $(this);
            detail(ths);
        });
        mui("header").on("click", ".mui-pull-left", function () {
            history.go(-1);
        });
    }

    //下拉刷新数据加载
    function getInitData() {
        //阻尼系数
        var deceleration = mui.os.ios ? 0.003 : 0.0009;
        mui('.mui-scroll-wrapper').scroll({
            bounce: false,
            indicators: true, //是否显示滚动条
            deceleration: deceleration
        });
        mui.ready(function () {
            //循环初始化所有下拉刷新，上拉加载。
            mui.each(document.querySelectorAll('.mui-slider-group .mui-scroll'), function (index, pullRefreshEl) {
                mui(pullRefreshEl).pullToRefresh({
                    up: {
                        callback: function () {
                            var self = this;
                            setTimeout(function () {
                                getData(index,false);
                                self.endPullUpToRefresh();
                            }, 1000);
                        }
                    }
                });
            });
        });
    }

    //数据获取,state为任务单状态,a全部任务单,0待审核,1已派车,2结束,6带派车
    function getData(Index,isFirst) {
    	var page = 1;
    	var api = "";
        if(Index == undefined){
            Index = 0;
        }
        if(Index === 0){
            page = pageFinish;
            api="SYZG_Report";
        }else if(Index === 1){
            page = pageWork;
            api="getSiteInfo";
        }
        $.ajax({
            type: "post",
            url: domain,
            data: {
                api: api,
                usr: user.usr,
                pwd: user.UUIDPwd,
                page: page,
                rows: pageSize
            },
            success: function (Result) {
                if (Result) {
                    var result = JSON.parse(Result);
                    if (result.success) {
                        var Data = result.data;
                        if(0 === Index){
                        	showData(Data.rows, Index);
                            pageFinish++;
                            $("#sliderSegmentedControl").find("a").eq(0).find("span").text(Data.total);
                        } else if (1 === Index) {
                       		showData(Data, Index);
                            pageWork++;
                            $("#sliderSegmentedControl").find("a").eq(1).find("span").text(Data.length);
                        }
                    } else {
                        if (isFirst) {
                            if ("无数据" !== result.message) {
                                mui.alert(result.message);
                            } else {
                                $("#sliderSegmentedControl").find("a").eq(Index).find("span").text(0);
                            }
                        } else {
                            mui.alert(result.message);
                        }
                    }
                } else {
                    mui.alert("系统错误");
                }
            }
        });
    }

    //数据展示
    function showData(data,_index) {
        var html = "";
        if(0 === _index){
        	for (var i = 0; i < data.length; i++) {
        	    var ths = data[i];
        	    html += '<li class="mui-table-view-cell"><ul>';
        	    html += '<li>编号:<a href="javascript:void(0);">' + ths.Id + '</a></li>';
        	    html += '<li>业务代表:<span>' + ths.Business + '</span><a class="task_detail">详情</a></li>';
        	    html += '<li>客户名称:<span>' + ths.Name + "(" + ths.JobTitle+ ")"+ '</span></li>';
        	    html += '<li>订单编号:<span>' + ths.OrderId + '</span></li>';
        	    html += '<li>车牌号:<span>' + ths.VehicleId + '</span></li>';
        	    html += '<li>开单日期:<span>' + ths.ReportTime + '</span></li>';
        	    html += '</ul></li>';
        	}
        }else{
        	for (var j=0;j<data.length;j++) {
        		var ths=data[j];
        		html += '<li class="mui-table-view-cell"><ul>';
        	    html += '<li>编号:<a href="javascript:void(0);">' + ths.TaskId + '</a></li>';
        	    html += '<li>业务代表:<span>' + ths.Business + '</span><a class="task_detail">详情</a></li>';
        	    html += '<li>客户名称:<span>' + ths.Name + "(" + ths.JobTitle+ ")"+ '</span></li>';
        	    html += '<li>车牌号:<span>' + ths.FInnerId + '</span></li>';
        	    html += '<li>车台长:<span>' + ths.DriverShip + '</span></li>';
        	    html += '</ul></li>';
        	}
        }
        $.each($(".mui-slider-group .mui-scroll"), function (index) {
            if (_index === index) {
                var that = $(this);
                that.find(".mui-table-view").append(html);
                $.each(that.find(".mui-table-view .mui-table-view-cell"), function (index) {
                    $(this).data($(this).find("li").eq(0).find("a").eq(0).text(), data[index]);
                });
            }
        });
    }

    //点击详情
    function detail(ths) {
        var taskId = ths.find("li").eq(0).find("a").eq(0).text();
        var taskDetail = ths.data(taskId);
        sessionStorage.setItem("driverDetail", JSON.stringify(taskDetail));
        if(taskId.indexOf("SR") > -1){        	
        	window.location.href = "driverDetail.html";
        }else{
        	window.location.href = "driver.html";
        }
    }

    init();
    bindEvent();
});
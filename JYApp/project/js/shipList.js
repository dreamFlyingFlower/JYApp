$(function () {
    //全局变量
    var unique = sessionStorage.getItem("unique");				//用户唯一标识
    var domain = $.domain(unique);
    var user = JSON.parse(sessionStorage.getItem("UserInfo"));
    var pageWait = 1;                       					//待派车分页页数
    var pageAlready = 1;                    					//已派车分页页数
    var pageSize = 10;                      					//分页条数
    //全局变量 end

    function init() {
    	if(!unique){
			mui.toast("用户唯一标识不存在,请重新登录");
			window.location.href = "login.html";
			return;
		}
        getInitData();
        setTimeout(getData(0,true), 300);        //待派车
        setTimeout(getData(1,true), 400);        //已派车
    }

    function bindEvent() {
        //点击详情
        $(".mui-table-view").on("click",".mui-table-view-cell",function () {
            var ths = $(this);
            detail(ths);
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
        if(Index == undefined){
            Index = 0;
        }
        var status = 6;
        if (Index === 0) {                      //待派车
            status = 6;
            page = pageWait;
        } else if (Index === 1) {               //已派车
            status = 1;
            page = pageAlready;
        }
        $.ajax({
            type: "post",
            url: domain,
            data: {
                api: "SYZG_TaskDispatch",
                usr: user.usr,
                pwd: user.UUIDPwd,
                status: status,
                page: page,
                rows: pageSize
            },
            success: function (Result) {
                if (Result) {
                    var result = JSON.parse(Result);
                    if (result.success) {
                        var Data = result.data;
                        showData(Data.rows, Index);
                        //分页处理
                        if(Index ===0 ){
                            pageWait++;
                        } else if (1 === Index) {
                            pageAlready++;
                        }
                        $("#sliderSegmentedControl").find("a").eq(Index).find("span").text(Data.total);
                    } else {
                        if (isFirst) {
                            if ("无数据" !== result.message) {
                                mui.alert(result.message);
                            } else {
                                $("#sliderSegmentedControl").find("a").eq(Index).find("span").text(0);
                            }
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
        for (var i = 0; i < data.length; i++) {
            var ths = data[i];
            html += '<li class="mui-table-view-cell"><ul>';
            html += '<li style="display:none;">编号:<a href="javascript:void(0);">' + ths.Id + '</a></li>';
            html += '<li>业务代表:<span>' + ths.Business + '</span><a class="task_detail">详情</a></li>';
            html += '<li>客户名称:<span>' + ths.Name + '</span></li>';
            html += '<li>车型:<span>' + ths.VehicleType + '</span></li>';
            if(ths.FInnerId){
            	html += '<li>车牌号:<span>' + ths.FInnerId + '</span></li>';
            	html += '<li>车台长:<span>' + ths.Driver + '</span></li>';
            	html += '<li>派车时间:<span>' + ths.DisTime + '</span></li>';
            }
            html += '<li>计划方量:<span>' + ths.PlanTaskTotal + '</span>方</li>';
            html += '<li>计划开盘时间:<span>' + ths.PlanBeginTime + '</span></li>';
            html += '<li>计划收盘时间:<span>' + ths.PlanEndTime + '</span></li>';
            html += '</ul></li>';
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
        sessionStorage.setItem("taskDetail", JSON.stringify(taskDetail));
        if (!taskDetail.ShipId && taskDetail.Closed === "0") {
            window.location.href = "ship.html";
        } else {
            window.location.href = "taskDetail.html";
        }
        
    }

    init();
    bindEvent();
});
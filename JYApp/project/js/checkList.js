$(function () {
    //全局变量
    var unique = sessionStorage.getItem("unique");	//用户唯一标识
    var domain = $.domain(unique);
    var user = JSON.parse(sessionStorage.getItem("UserInfo"));
    var pageWait = 1;                       		//待审核分页页数
    var pageAlready = 1;                    		//已审核分页页数
    var pageFinish = 1;                     		//驳回分页页数
    var pageClosed = 1;                     		//申请关闭分页页数
    var pageSize = 10;                      		//分页条数
    //全局变量 end

    function init() {
    	if(!unique){
			mui.toast("用户唯一标识不存在,请重新登录");
			window.location.href = "login.html";
			return;
		}
        getInitData();
        setTimeout(getData(0, true), 300);
        setTimeout(getData(1, true), 400);
        setTimeout(getData(2, true), 500);
        setTimeout(getData(3, true), 500);
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
    function getData(Index, isFirst) {
        var page = 1;
        if(Index === undefined){
            Index = 0;
        }
        if(Index === 0){
            page = pageWait;
        }else if(Index === 1){
            page = pageAlready;
        } else if (Index === 2) {
            page = pageFinish;
        } else if(3 === Index ){
            page = pageClosed;
        }
        $.ajax({
            type: "post",
            url: domain,
            data: {
                api: "SYZG_Taskapv",
                usr: user.usr,
                pwd: user.UUIDPwd,
                status: Index,
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
                        } else if (2 === Index) {
                            pageFinish++;
                        } else if (3 === Index){
                            pageClosed++;
                        }
                        $("#sliderSegmentedControl").find("a").eq(Index).find("span").text(Data.total);
                    } else {
                        if (isFirst) {
                            if ("无数据" == result.message) {
                                $(".mui-pull-bottom-wrapper .mui-pull-loading").text("无数据");
                                $("#sliderSegmentedControl").find("a").eq(Index).find("span").text(0);
                            }
                        } else {
                            if ("无数据" == result.message) {
                                $(".mui-pull-bottom-wrapper .mui-pull-loading").text("无数据");
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
            html += '<li>编号:&nbsp;<a href="javascript:void(0);">' + ths.Id + '</a></li>';
            html += '<li>业务代表:&nbsp;<span>' + ths.Business + '</span><a class="task_detail">详情</a></li>';
            html += '<li>任务状态:&nbsp;<span>' + formatState(_index) + '</span></li>';
            html += '<li>客户名称:&nbsp;<span>' + ths.Name + '</span></li>';
            html += '<li>施工地:&nbsp;<span>' + ths.SiteName + '</span></li>';
            html += '<li>车型:&nbsp;<span>' + ths.VehicleType + '</span></li>';
            html += '<li>合同单价:&nbsp;<span>' + ths.RentUnitPrice + '</span>元/方</li>';
            html += '<li>计划方量:&nbsp;<span>' + ths.PlanTaskTotal + '</span>方</li>';
            html += '<li>计划开盘时间:&nbsp;<span>' + ths.PlanBeginTime + '</span></li>';
            html += '<li>计划收盘时间:&nbsp;<span>' + ths.PlanEndTime + '</span></li>';
            if (3 === _index) {
                html += '<li>关闭否:&nbsp;<span>申请关闭</span></li>';
            }
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

    //审核状态格式化
    function formatState(Index) {
        switch (Index) {
            case 0:
                return "待审核";
            case 1:
                return "已审核";
            case 2:
                return "驳回";
            default:
                return "待审核";
        }
    }

    //点击详情
    function detail(ths) {
        var taskId = ths.find("li").eq(0).find("a").eq(0).text();
        var taskDetail = ths.data(taskId);
        sessionStorage.setItem("taskDetail", JSON.stringify(taskDetail));
        window.location.href = "taskDetail.html";
    }

    init();
    bindEvent();
});
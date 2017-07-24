$(function () {
    //全局变量
    var unique = sessionStorage.getItem("unique");	//用户唯一标识
    var domain = $.domain(unique);
    var user = JSON.parse(sessionStorage.getItem("UserInfo"));
    var pageAll = 1;                        //所有任务分页页数
    var pageCheck = 1;                      //待审核分页页数
    var pageCar = 1;                        //待派车分页页数
    var pageAlready = 1;                    //已派车分页页数
    var pageFinish = 1;                     //完成分页页数
    var pageSize = 10;                      //分页条数
    //全局结束

    function init() {
    	if(!unique){
			mui.toast("用户唯一标识不存在,请重新登录");
			window.location.href = "login.html";
			return;
		}
        setTimeout(getData(0, true), 200);
        setTimeout(getData(1, true), 300);
        setTimeout(getData(2, true), 400);
        setTimeout(getData(3, true), 450);
        setTimeout(getData(4, true), 500);
        getInitData();
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

    //数据获取,state为任务单状态,a全部任务单,0待审核,1已派车,2结束,6带派车,iSFirst是否为第一次加载
    function getData(Index,isFirst) {
        var page = 1;
        if(Index == undefined){
            Index = 0;
        }
        var state = "a";
        if(Index === 0){
            state = "a";
            page = pageAll;
        }else if(Index === 1){
            state = 0;
            page = pageCheck;
        }else if(Index ===2 ){
            state = 6;
            page = pageCar;
        } else if (Index === 3) {
            state = 1;
            page = pageAlready;
        } else if (Index === 4) {
            state = 2;
            page = pageFinish;
        }
        $.ajax({
            type: "post",
            url: domain,
            data: {
                api: "SYZG_TaskInfo",
                usr: user.usr,
                pwd: user.UUIDPwd,
                status:state,
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
                            pageAll++;
                        } else if (1 === Index) {
                            pageCheck++;
                        } else if(2 === Index ){
                            pageCar++;
                        } else if (3 === Index) {
                            pageAlready++;
                        } else if (4 === Index) {
                            pageFinish++;
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
            html += '<li class="mui-table-view-cell"><div><ul>';
            html += '<li>编号:&nbsp;<a href="javascript:void(0);">' + ths.Id + '</a></li>';
            html += '<li>业务代表:&nbsp;<span>' + ths.Business + '</span></li>';
            html += '<li>客户名称:&nbsp;<span>' + ths.Name + '</span></li>';
            html += '<li>计划方量:&nbsp;<span>' + ths.PlanTaskTotal + '</span>方</li>';
            html += '</ul></div><div><ul>';
            html += '<li><a href="javascript:void(0);">' + getState(ths.State) + '</a><a class="task_detail">详情</a></li>';
            html += '<li>下单时间:&nbsp;<span>' + ths.InsertDate + '</span></li>';
            html += '<li>客户代码:&nbsp;<span>' + ths.JobTitle + '</span></li>';
            html += '<li class="mui-ellipsis">施工地:&nbsp;<span>' + ths.SiteName + '</span></li>';
            html += '</ul></div></li>';
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
        window.location.href = "taskDetail.html";
    }


    //字典类
    function getState(state) {
        switch (state) {
            case "0":
                return "待审核";
            case "1":
                return "已派车";
            case "2":
                return "完成";
            case "6":
                return "待派车";
            default:
                return "未知状态";
        }
    }

    init();
    bindEvent();
    
    
	if(window.plus){
		plusReady();
	}else{
		document.addEventListener('plusready',plusReady,false);
	}
	
    var first = null;
	function plusReady(){
		plus.key.addEventListener('backbutton',function(){
			console.log(22233);
			if ('Android' == plus.os.name) {
			    mui.back = function() {
			        if (!first) {
			        	console.log(1111);
			            first = new Date().getTime();
			            mui.toast('再按一次退出应用');
			            setTimeout(function() {
			                first = null;
			            }, 1000);
			        } else {
			        	console.log(2222);
			            if (new Date().getTime() - first < 1000) {
			                plus.runtime.quit();
			            }
			        }
			    }
			}
		},false);
	}
});

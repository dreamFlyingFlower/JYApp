$(function(){
	/*---------------全局变量 start---------------*/
	var unique = sessionStorage.getItem("unique");				//用户唯一标识
	var domain = $.domain(unique);
	var user = JSON.parse(sessionStorage.getItem("UserInfo"));
	var carsHisSearch = null;									//搜索记录
	var carsList = {};											//搜索记录数组
	var app = "MN16040013";										//搜索车辆详情需要的appid
	/*---------------全局变量 end---------------*/

	function init(){
		if(!unique){
			mui.toast("用户唯一标识不存在,请重新登录");
			window.location.href = "login.html";
			return;
		}
		$("input[type='search']").focus();
		carsHisSearch = localStorage.getItem("carsHisSearch"+user.usr + unique);
		if(carsHisSearch){
			try{
				carsList = JSON.parse(carsHisSearch) ? JSON.parse(carsHisSearch) : "";
			}catch(e){
				console.log(e.message);
			}
			if(!carsList){
				return;
			}
			var html = "";
			for(var key in carsList){
				html+='<li class="mui-table-view-cell">'+carsList[key]+'</li>';
			}
			$(".mui-table-view").html(html);
		}
	}

	function bindEvent(){
		//模糊搜索
		$("input").on("keyup",function(){
			carKeyup($(this).val());
		});
		//失去焦点隐藏
		$("input").blur(function(){
			$(".cars_search_rs").hide();
		});
		//查找
		mui('.cars_search_latest').on('tap','#search',function(){
			search($("input").val());
		});
		//清空历史记录
		mui('.cars_search_latest').on('tap','#clearHistory',function(){
			localStorage.removeItem("carsHisSearch"+user.usr + unique);
			$(".mui-table-view").html("");
			mui.alert("已清空记录");
		});
	}
	//车牌号模糊查找
	function carKeyup(key){
		$.ajax({
			type:"post",
			url:domain,
			data:{
				api:"getCarsInnerTree",
				usr:user.usr,
				status: 4,
				isAll:10,
				q:key
			},
			success:function(Result){
                if(Result){
                    var result = JSON.parse(Result).data.rows;
                    var html = "";
                    for (var i=0;i<result.length;i++) {
                    	html+='<li class="mui-table-view-cell">'+result[i].VehicleId+"("+result[i].FInnerId+")"+'<span style="display:none;">'+ result[i].VehicleId +'</span></li>';
                    }
                    $(".cars_search_rs").html(html);
                }else{
                    $(".cars_search_rs").html("");
                }
                $(".mui-table-view").hide().next(".cars_search_rs").show();
                mui('.cars_search_rs').on('tap','li',function(){
                	$("input").val($(this).find("span").text());
                	$(".mui-table-view").show().next(".cars_search_rs").hide();
                	search($(this).find("span").text());
                });
        	}
		});
	}
	//点击搜索按钮的结果
	function search(car){
		if(!car){
			mui.alert("车牌号不能为空!");
			return;
		}
		carsList[car] = car;
		localStorage.setItem("carsHisSearch"+user.usr + unique,JSON.stringify(carsList));
		$.ajax({
			type:"post",
			url:domain,
			data:{
				usr:user.usr,
				pwd:user.UUIDPwd,
				api:"getCarDetail",
				car:car,
				app:app
			},
			success:function(Result){
				if(Result){
					var result = JSON.parse(Result);
					if (result.success) {
						var data = result.data[0];
						//下次打开app将直接使用此车辆,但是在trailMonitor页面需重新请求数据
						localStorage.setItem("historySearch"+user.usr + unique,JSON.stringify(data));
						window.location.href = "trailMonitor.html";
					} else{
						mui.alert(result.message);
					}
				}else{
					mui.alert("无数据");
				}
			}
		});
	}

	//初始化
	init();
	//绑定事件
	bindEvent();
});
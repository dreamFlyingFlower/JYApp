$(function(){
	/*---------------全局变量 start---------------*/
	var unique = sessionStorage.getItem("unique");					//用户唯一标识
	var domain = $.domain(unique);
	var map = new BMap.Map("allmap");
	var user = JSON.parse(sessionStorage.getItem("UserInfo"));		//获取登录数据
	var Data = [];													//历史轨迹数据
	var Points = [];												//百度历史轨迹经纬度数组
	var NoZeroData = [];											//去除速度为0的数据数组
	var NoZeroPoints = [];											//去除速度为0的百度经纬度点数组
	var thsPointIndex = 0;											//有速度0当前播放点下标
	var NoPointIndex = 0;											//无速度0当前播放点下标
	var NoZeroItIndex = {};											//无0数据对应的有0数组中的it
	var playInterval;												//播放轨迹定时任务标识
	var playSpeed = 1000;											//播放速度,初始为1000毫秒
	var beginMarker,endMarker,playMarker;							//起始标点,结束标点,播放标签
	var status = 0;													//播放状态,0起始,1播放,2暂停,3停止
	var playSpeedStatus = 0;										//播放快进或慢放-1慢放,0正常,1跨进
	var NoZeroStatus = 1;											//播放状态,1无0速度播放,0有0播放
	/*---------------全局变量 end---------------*/

	//初始化
	function init(){
		if(!unique){
			mui.toast("用户唯一标识不存在,请重新登录");
			window.location.href = "login.html";
			return;
		}
		loginCheck();
		mui.init();
		$.map_init(map);
	}

	//绑定事件
	function bindEvent(){
		//播放
		mui('nav').on('tap','.track_play',function(){
			play();
		});
		//快进
		mui('nav').on('tap','.track_quick',function(){
			clearInterval(playInterval);
			if(-1 === playSpeedStatus){					//慢放后快进
				playSpeed = 1000;
				$(".track_slow").siblings("span").text("");
			}
			playSpeedStatus = 1;
			if(playSpeed>200){
				playSpeed-=200;
				$(this).siblings("span").text("X" + (1000-playSpeed)/200);
			}
			playInterval = setInterval(paintTrackLine, playSpeed);
		});
		//慢放
		mui('nav').on('tap','.track_slow',function(){
			clearInterval(playInterval);
			if(1 === playSpeedStatus){					//快进后慢放
				playSpeed = 1000;
				$(".track_quick").siblings("span").text("");
			}
			playSpeedStatus = -1;
			playSpeed+=200;
			$(this).siblings("span").text("X" + (playSpeed-1000)/200);
			playInterval = setInterval(paintTrackLine, playSpeed);
		});
		//停止
		mui('nav').on('tap','.track_end',function(){
			StopTrackBack();
		});
	}

	function destory(){
		window.onunload = function(){
		};
	}

	//登录检测
	function loginCheck(){
		if(!user){
			mui.toast("登录超时");
			setTimeout(function(){
				window.location.href = "login.html";
			},2000);
			return;
		}else{
			firstShow();
			getData();
		}
	}

	function firstShow(){
		//初始化展示车辆数据
		var sessionData = localStorage.getItem("historySearch"+user.usr + unique);
		var carData = JSON.parse(sessionData);
		$("#cars").text(carData.FInnerId);
		$(".track_detail_all li").eq(2).find("a").text($.direction(carData.Direction).name);
		$(".track_detail_all li").eq(4).find("a").text($.statusInfo(carData.StatusInfo,carData.VehicleType));
		dataShow(carData,true);
	}

	//数据获取
	function getData(){
		var trackCondition = {};
		var track_search = 	sessionStorage.getItem("track_search");
		if(track_search){
			trackCondition =JSON.parse(track_search);
		}else{
			mui.toast("请求参数错误");
			return;
		}

		//获得历史轨迹数据
		$.ajax({
			type:"post",
			url:domain,
			data:{
				api:"history_pos",
				usr:user.usr,
				pwd:user.UUIDPwd,
				car : trackCondition.car,
				begin_time : trackCondition.begin_time,
				end_time : trackCondition.end_time
			},
			success:function(Result){
				if(Result){
					var result = JSON.parse(Result);
					if(result.success){
						if(result.data.length === 0){
							mui.toast("无数据");
							return;
						}else{
							Data = result.data;
							var count = 0;
							for (var i=0;i<Data.length;i++) {
								//转换成百度经纬度
								var BMll = $.transfromFromWGSToBDJ(Data[i].Lng,Data[i].Lat);
								Data[i].Lng = BMll.lng;
								Data[i].Lat = BMll.lat;
								Points.push(new BMap.Point(BMll.lng,BMll.lat));
								if(Data[i].Speed !== 0){
									NoZeroData.push(Data[i]);
									NoZeroPoints.push(new BMap.Point(BMll.lng,BMll.lat));
									NoZeroItIndex[Data[i].it] = count;
									count++;
								}
							}
							addOverlays(Data);
						}
					}else{
						mui.toast(result.message);
					}
				}else{
					mui.alert("系统错误");
				}
			}
		});
	}

	//初始化画轨迹线
	function addOverlays(data){
		var leng = data.length;
		beginMarker = new BMap.Marker(Points[0],{icon:new BMap.Icon("../images/u653.png",new BMap.Size(29,40))});		//起点
		endMarker = new BMap.Marker(Points[leng-1],{icon:new BMap.Icon("../images/u655.png",new BMap.Size(29,40))});	//终点
		playMarker = new BMap.Marker(Points[0],{icon:new BMap.Icon("../images/direction/park_00.png",new BMap.Size(18,40))});		//播放点开始就是起点
		var polyline = new BMap.Polyline(Points,{strokeColor:"blue",strokeWeight:5,strokeOpacity:1,strokeStyle:"solid"});
		map.addOverlay(beginMarker);
		map.addOverlay(endMarker);
		map.addOverlay(polyline);
		map.setZoom(14);
		map.panTo(Points[0]);
		//设置range的值
		if($(".mui-switch").hasClass("mui-active")){					//无0播放状态,默认
			$("#block-range").prop("max",NoZeroPoints.length);
		}else{
			$("#block-range").prop("max",leng);							//有0播放
		}
		var range = document.getElementById("block-range");
		range.addEventListener("input",function(e){
			dragTrack(parseInt(this.value));
		});
	}

	//拖动进度条
	function dragTrack(theIndex){
		if($(".mui-switch").hasClass("mui-active")){
			NoPointIndex = theIndex;
			if(NoPointIndex >= NoZeroData.length -1){
				NoPointIndex = NoZeroData.length -1;
			}
			dataShow(NoZeroData[NoPointIndex]);
			iconSet(NoZeroData[NoPointIndex]);
			playMarker.setPosition(NoZeroPoints[NoPointIndex]);
			//米有播放,直接拖动进度条
			if(status === 0){
				map.addOverlay(playMarker);
				map.panTo(NoZeroPoints[NoPointIndex]);
			}
		}else{			
			thsPointIndex = theIndex;
			if(thsPointIndex >= Data.length -1){
				thsPointIndex = Data.length -1;
			}
			dataShow(Data[thsPointIndex]);
			iconSet(Data[thsPointIndex]);
			playMarker.setPosition(Points[thsPointIndex]);
			//米有播放,直接拖动进度条
			if(status === 0){
				map.addOverlay(playMarker);
				map.panTo(Points[thsPointIndex]);
			}
		}
	}

	//播放,暂停
	function play(){
		var leng = Data.length;
		if(leng === 0){
			return;
		}
		map.setZoom(15);
		map.addOverlay(playMarker);
        if (status === 0) {								//第一次点击播放按钮
            status = 1;
            $(".track_play").attr("src","../images/u698.png");
            playInterval = setInterval(paintTrackLine, playSpeed);
        }else if(status === 1){							//播放状态,点击后变成播放按钮,暂停播放
        	status = 2;
            $(".track_play").attr("src","../images/u659.png");
            clearInterval(playInterval);
        }else if(status ===2 ){							//暂停状态,点击后变成暂停按钮,播放轨迹
        	status = 1;
        	$(".track_play").attr("src","../images/u698.png");
            playInterval = setInterval(paintTrackLine, playSpeed);
    	}
	}

	//播放轨迹
	function paintTrackLine(){
		var leng = Data.length;
		var lengZero = NoZeroData.length;
		thsPointIndex = parseInt(thsPointIndex);
		NoPointIndex = parseInt(NoPointIndex);
		if($(".mui-switch").hasClass("mui-active")){				//播放无0轨迹
			if(!lengZero){											//若速度全为0
				$(".mui-switch").removeClass("mui-active");
				$("#block-range").prop("max",leng);	
				NoZeroStatus =0;
				return;
			}
			if(1 !== NoZeroStatus){									//从有0播放切换到无0播放
				NoZeroStatus = 1;									//状态改变
				var It = Data[thsPointIndex].it;
				if(Data[thsPointIndex].Speed !== 0){				//若是有0播放正好播放到有速度的,直接利用it进行切换到无0播放
					NoPointIndex = NoZeroItIndex[It];
					$("#block-range").prop("max",lengZero);			//重置进度条最大值
				}else{												//若是播放到无速度时切换,无0数据组中没有数据,无法利用it进行匹配,要循环原始数据进行匹配
					var maxNoZeroIt = NoZeroData[lenzero -1].it;	//若有0播放的it比无0播放的最后一个值的it都大,直接停止播放
					if(It >= maxNoZeroIt){
						NoPointIndex=lengZero;
					}else{
						for(var i=0;i<lengZero;i++){				//循环检查it的值,先和最大值进行过比较,此处不用考虑数据越界
							if(It > NoZeroData[i].it && It < NoZeroData[i+1].it){
								NoPointIndex = i;
								break;
							}
						}
					}
				}
			}
			if(lengZero > NoPointIndex){
				var thsData = NoZeroData[NoPointIndex];
				map.panTo(NoZeroPoints[NoPointIndex]);
				$("#block-range").val(NoPointIndex+1);				//进度条设置
				iconSet(thsData);									//图标设置
				playMarker.setPosition(NoZeroPoints[NoPointIndex]);	//坐标设置
				dataShow(thsData);									//信息设置
				NoPointIndex++;
			}else{
				status = 0;											//停止状态
				$(".track_play").attr("src","../images/u659.png");
				clearInterval(playInterval);
				mui.alert("播放结束!");
			}
		}else{														//播放有0数据
			if(0 !== NoZeroStatus){									//从无0播放切换到有0播放,检查状态	
				NoZeroStatus = 0;									//状态改变
				if(NoZeroData.length){								//若NoZeroData有数据
					thsPointIndex = NoZeroData[NoPointIndex].it -1;	//根据两组都有的数据库排序it进行数据切换,NoZeroData的it不连续,但和原始数据对应
				}else{												//若NoZeroData没有数据
					thsPointIndex = 0 ;
				}
				$("#block-range").prop("max",leng);					//重置进度条最大值
			}
			if(leng > thsPointIndex){							//播放有0轨迹
				var thsData = Data[thsPointIndex];
				map.panTo(Points[thsPointIndex]);
				$("#block-range").val(thsPointIndex+1);				//进度条设置
				iconSet(thsData);									//图标设置
				playMarker.setPosition(Points[thsPointIndex]);		//坐标设置
				dataShow(thsData);									//信息设置
				thsPointIndex++;
			}else{
				status = 0;									//停止状态
				$(".track_play").attr("src","../images/u659.png");
				clearInterval(playInterval);
				mui.alert("播放结束!");
			}
		}
	}

	//停止播放
	function StopTrackBack() {
	    status = 0;
	    NoPointIndex = 0;
	    thsPointIndex = 0;
	    playSpeed = 1000;
	    playSpeedStatus = 0;
	    NoZeroStatus = 1;
	    $(".track_quick").siblings("span").text("");
	    $(".track_slow").siblings("span").text("");
	    clearInterval(playInterval);
	    map.panTo(Points[0]);
	    $("#block-range").val(0);
	    $(".track_play").attr("src","../images/u659.png");
	    firstShow();
	}

	//数据展示,isFirst是否为第一次加载
	function dataShow(param,isFirst){
		$(".track-time a").html(param.RecordTime ? param.RecordTime : new Date().toLocaleDateString());
		$(".track_detail_all li").eq(0).find("a").text(param.Speed);
		$(".track_detail_all li").eq(2).find("a").text($.direction(param.Speed).name);
		$(".track_detail_all li").eq(3).find("a").text(param.Oil);
		if(isFirst){
			$(".track_detail_all li").eq(1).find("a").text(0);
			$.geocoder(param.Lng,param.Lat,function(rs){
				$(".track_detail_all li").eq(5).find("a").text(rs.address);
			},true);
		}else{
			if(0 === NoZeroStatus){
				$(".track_detail_all li").eq(1).find("a").text(parseInt(Data[thsPointIndex].Mileage - Data[0].Mileage));
			}else if(1 === NoZeroStatus){
				$(".track_detail_all li").eq(1).find("a").text(parseInt(NoZeroData[NoPointIndex].Mileage - Data[0].Mileage));
			}
		}
	}

	//不同状态图标设置
	function iconSet(thsData){
		//根据车辆状态判断图标,默认都在线
		if(thsData.WarnInfo.indexOf("1") > -1){										//报警状态
			if(thsData.Speed === 0){
				playMarker.setIcon(new BMap.Icon("../images/direction/warn_00.png",new BMap.Size(35,35)));
			}else{
				playMarker.setIcon(new BMap.Icon($.direction(thsData.Direction,"warn").img,new BMap.Size(35,35)));
			}
		}else if(thsData.Speed === 0){												//速度为0的停止状态
			playMarker.setIcon(new BMap.Icon("../images/direction/park_00.png",new BMap.Size(35,35)));
		}else{																		//在线状态,根据方向不同定制不同图标
			playMarker.setIcon(new BMap.Icon($.direction(thsData.Direction,"online").img,new BMap.Size(35,35)));
		}
	}

	//初始化
	init();
	//绑定事件
	bindEvent();
	//销毁
	destory();
});
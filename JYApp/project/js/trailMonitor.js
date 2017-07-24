$(function() {
	/*---------------全局变量 start---------------*/
	var map = new BMap.Map("allmap");
	var unique = sessionStorage.getItem("unique");				//localstorage唯一标识
	var geoc = new BMap.Geocoder();
	var domain = Config.HttpList[unique];
	var user = JSON.parse(sessionStorage.getItem("UserInfo"));
	var MultiData = [];											//多车监控数据
	var MultiLeng = 0;											//多车监控数据长度
	var MultiIndex = 0;											//多车监控当前显示下标
	var SingleCar = "";											//单车监控vehileId
	var ReqTime = parseInt(sessionStorage.getItem("ConfigMonitorTime"))*1000;	//监控请求间隔时间
	var MonitorType = "single";									//监控模式single单车,multi多车
	var UseType = "car";										//使用模式person人,car车
	var Timeout = 0;											//监控定时服务编号
	var PersonPoint = null;										//人模式下全景图所需百度point
	/*---------------全局变量 end---------------*/

	//初始化
	function init() {
		if(!unique){
			mui.toast("用户唯一标识不存在,请重新登录");
			window.location.href = "login.html";
			return;
		}
		//地图初始化配置
		var param = {
			isTraffic:true,
			isScale:true,
			isMapType:true
		};
		$.map_init(map,param);
		//时间间隔检测,不得小于5秒
		if(!ReqTime || parseInt(ReqTime) < 5000){
			ReqTime = 30000;
		}
		initCar();
	}

	/*---------------事件绑定 start---------------*/
	function bindEvent() {
		//搜索跳转
		mui(".trailMonitor_search").on("tap", ".mui-search", function() {
			window.location.href = 'cars_search.html';
		});
		//mui阻止了a的默认跳转事件,要跳转页面必须写方法
		mui(document).on("tap", "a", function() {
			if($(this).attr("href")){
				window.location.href = $(this).attr("href");
			}
		});
		//经纬度切换全景图
		$(".trailMonitor-panorama").click(function(){
			panorama();
		});
		//多车,单车监控切换
		$(".trailMonitor-multi").click(function(){
			changeMulSing();
		});
		//人车切换
		$(".trailMonitor-person").click(function(){
			changePersonCar();
		});
		//多车监控左移车辆
		$(".trailMonitor-left").click(function(){
			if("car" === UseType){
				$(this).attr("src","../images/click_18.png");
				multiLeft();
				setTimeout(function(){
					$(".trailMonitor-left").attr("src","../images/buttons_14.png");
				},500);
			}
		});
		//多车监控右移车辆
		$(".trailMonitor-right").click(function(){
			if("car" === UseType){
				$(this).attr("src","../images/click_20.png");
				multiRight();
				setTimeout(function(){
					$(".trailMonitor-right").attr("src","../images/buttons_16.png");
				},500);
			}
		});
		//返回主页面,隐藏全景图
		mui("header").on("tap","a",function(){
			$("#BM-panorama").hide();
			$("header").hide();

			$(".mui-search").show();
			$(".trailMonitor_change").show();
			$("#allmap").show();
			$(".trailMonitor-change").show();
			$(".trailMonitor-left").show();
			$(".trailMonitor-right").show();
			$("nav").show();
		});
	}
	/*---------------事件绑定 end---------------*/


	/*--------------------单车,多车监控-------------------*/
	//检测缓存中是否有需要搜索的car
	function initCar() {
		//取得从搜索页面的数据或车辆列表页面
		var sessionData = localStorage.getItem("historySearch"+user.usr+unique);
		if(sessionData) {
			var indexCar = sessionData.indexOf("|carStatus");
			//来自车辆列表
			if( indexCar > -1){
				SingleCar = sessionData.substring(0,indexCar);
			}else{
				var carData = JSON.parse(sessionData);
				SingleCar = carData.VehicleId;
			}
			getSingleData();
		}else{
			//若是被清除了localstorage或第一次登录
			multiMonitor(true);
		}
		//获得本帐号下所有车辆
		multiMonitor(false);
	}

	//多车监控,isFirst是否为第一次调用,主要用于第一次登录选车或localstorage被清楚
	function multiMonitor(isFirst){
		$.ajax({
			type:"post",
			url:domain,
			data:{
				api: "getCarsInnerTree",
				usr: user.usr,
				status: 4,
				isAll:1
			},
			success:function(Result){
				if(Result){
					var result = JSON.parse(Result);
					if(result.success){
						var Data = result.data.rows;
						MultiData = Data;
						MultiLeng = Data.length;
						//初次请求,默认单车监控模式,只选第一辆车显示
						if(isFirst){
							dataShow(result.data.rows[0]);
							SingleCar = result.data.rows[0].VehicleId;
							localStorage.setItem("historySearch"+user.usr + unique,JSON.stringify(result.data.rows[0]));
						//单车监控处理
						}else if(isFirst && "car" === UseType && "single" === MonitorType){
							getSingleData();
						//多车监控处理
						}else if("car" === UseType && "multi" === MonitorType){
							map.clearOverlays();
							for(var i = 0; i < MultiLeng; i++) {
								dataShow(Data[i]);
							}
							//每次调用后打开当前选中车辆标签
							var marker = new BMap.Marker(new BMap.Point($.transfromFromWGSToBDJ(Data[MultiIndex].Lng,Data[MultiIndex].Lat).lng,$.transfromFromWGSToBDJ(Data[MultiIndex].Lng,Data[MultiIndex].Lat).lat));
							openInfoWindow(marker,Data[MultiIndex],Data[MultiIndex].VehicleId,Data[MultiIndex].FInnerId,true);
							SingleCar = Data[MultiIndex].VehicleId;
						}
					}else{
						mui.toast(result.message);
					}
				}else{
					mui.toast("无数据");
				}
			}
		});
		//只有多车监控时才定时调用接口
		if("car" === UseType && "multi" === MonitorType){
			Timeout = setTimeout(multiMonitor,ReqTime);
		}
	}

	//获得单车数据
	function getSingleData(){
		clearTimeout(Timeout);
		$.ajax({
			type:"post",
			url:domain,
			data:{
				usr:user.usr,
				pwd:user.UUIDPwd,
				api:"getCarDetail",
				car:SingleCar,
				app:"MN16040013"
			},
			success:function(Result){
				if(Result){
					var result = JSON.parse(Result);
					if (result.success) {
						var data = result.data[0];
						//重新请求数据之后覆盖以前的数据
						localStorage.setItem("historySearch"+user.usr + unique,JSON.stringify(data));
						//清除所有点
						map.clearOverlays();
						dataShow(data);
					} else{
						mui.toast(result.message);
					}
				}else{
					mui.toast("无数据");
				}
			}
		});
		Timeout = setTimeout(function(){
			getSingleData();
		},ReqTime);
	}

	//单车多车监控切换
	function changeMulSing(){
		clearTimeout(Timeout);
		if("single" === MonitorType && "car" === UseType){					//单车切换到多车
			MonitorType = "multi";
			$(".trailMonitor-multi").attr("src","../images/buttons_03.png");
			//此处循环是为了单车,多车监控在切换时能是同一辆车
			for (var i = 0; i < MultiLeng ; i++) {
				if(SingleCar === MultiData[i].VehicleId){
					MultiIndex = i;
				}
			}
			multiMonitor(false);
		}else if("multi" === MonitorType && "car" === UseType){				//切换到单车
			MonitorType = "single";
			map.clearOverlays();
			$(".trailMonitor-multi").attr("src","../images/buttons_05.png");
			getSingleData();
		}
	}

	//根据数组中位置左移车辆监控
	function multiLeft(){
		if(!MultiLeng || MultiLeng < 0 ){
			return;
		}else{
			MultiIndex--;
			//循环到最后一个
			if(-1 === MultiIndex){
				MultiIndex = MultiLeng -1;
			}
			SingleCar = MultiData[MultiIndex].VehicleId;
			if("car" === UseType && "single" === MonitorType){
				map.clearOverlays();
				getSingleData();
			}else{
				var thsData = MultiData[MultiIndex];
				var thsPoint = new BMap.Point($.transfromFromWGSToBDJ(thsData.Lng,thsData.Lat).lng,$.transfromFromWGSToBDJ(thsData.Lng,thsData.Lat).lat);
				var thsMarker = new BMap.Marker(thsPoint);
				localStorage.setItem("historySearch"+ user.usr + unique,JSON.stringify(thsData));
				openInfoWindow(thsMarker,thsData,thsData.VehicleId,thsData.FInnerId,true);
			}
		}
	}

	//根据数组中位置右移车辆监控
	function multiRight(){
		if(!MultiLeng || MultiLeng < 0){
			return;
		}else{
			MultiIndex++;
			//循环到第一个
			if(MultiIndex >= MultiLeng){
				MultiIndex = 0;
			}
			SingleCar = MultiData[MultiIndex].VehicleId;
			if("car" === UseType && "single" === MonitorType){
				map.clearOverlays();
				getSingleData();
				return;
			}else{
				var thsData = MultiData[MultiIndex];
				var thsPoint = new BMap.Point($.transfromFromWGSToBDJ(thsData.Lng,thsData.Lat).lng,$.transfromFromWGSToBDJ(thsData.Lng,thsData.Lat).lat);
				var thsMarker = new BMap.Marker(thsPoint);
				localStorage.setItem("historySearch"+ user.usr + unique,JSON.stringify(thsData));
				openInfoWindow(thsMarker,thsData,thsData.VehicleId,thsData.FInnerId,true);
			}
		}
	}

	//通用数据展示
	function dataShow(carData){
		var vehicleId  = carData.VehicleId ? carData.VehicleId : carData.VehicleId1;
		var BMll = $.transfromFromWGSToBDJ(carData.Lng,carData.Lat);
		var point = new BMap.Point(BMll.lng,BMll.lat);
		var marker = null;
		//根据车辆状态设置图标
		if(carData.WarnInfo.indexOf("1") > -1){												//报警状态
			if(carData.Speed === 0){
				marker = new BMap.Marker(point,{icon:new BMap.Icon("../images/direction/warn_00.png",new BMap.Size(30,30))});
			}else{
				marker = new BMap.Marker(point,{icon:new BMap.Icon($.direction(carData.Direction,"warn").img,new BMap.Size(30,30))});
			}
		} else if(carData.Online === "1"){													//在线离线状态
			if(carData.Speed === 0){														//在线停车
				marker = new BMap.Marker(point,{icon:new BMap.Icon("../images/direction/park_00.png",new BMap.Size(30,30))});
			}else{																			//在线行驶
				marker = new BMap.Marker(point,{icon:new BMap.Icon($.direction(carData.Direction,"online").img,new BMap.Size(30,30))});
			}
		} else if(carData.Online === "0"){													//离线状态
			if(carData.Speed === 0){													//速度为0的停止状态
				marker = new BMap.Marker(point,{icon:new BMap.Icon("../images/direction/offline_00.png",new BMap.Size(30,30))});
			}else{																			//在线状态,根据方向不同定制不同图标
				marker = new BMap.Marker(point,{icon:new BMap.Icon($.direction(carData.Direction,"offline").img,new BMap.Size(30,30))});
			}
		}
		//多车监控请求时并不自动弹出信息框
		if("multi" === MonitorType && "car"===UseType){
			openInfoWindow(marker,carData,vehicleId,carData.FInnerId,false);
		}else{
			openInfoWindow(marker,carData,vehicleId,carData.FInnerId,true);
		}
		var label = new BMap.Label('<span">'+carData.FInnerId+'</span>',{offset:new BMap.Size(30,3)});
		label.setStyle({border:"none",backgroundColor:"yellow"});
		marker.setLabel(label);
		map.addOverlay(marker);
//		var infoBox =  new BMapLib.InfoBox(map,'<a href="javascript:void(0);">' + (carData.VehicleId ? carData.VehicleId : carData.VehicleId1) + '</a>',
//		{boxStyle:{background:"url('../images/u653.png') no-repeat center top",
//		width: "200px",height:"100px","background-color":"rgba(0,0,0,.8)"},closeIconMargin: "10px 2px 0 0",enableAutoPan: true,alignBottom: false});
//		infoBox.open(marker);
	}
	/*--------------------单车,多车监控-------------------*/


	/*--------------------人车切换-------------------*/
	//人车切换
	function changePersonCar(){
		map.clearOverlays();
		clearTimeout(Timeout);
		if("person" === UseType){						//切换到车
			UseType = "car";
			MonitorType = "single";
			$(".trailMonitor-person").attr("src","../images/buttons_10.png");
			initCar();
		}else if("car" === UseType){
			UseType = "person";							//切换到人
			$(".trailMonitor-person").attr("src","../images/buttons_09.png");
			locationPerson();
		}
	}

	//切换到人
	function locationPerson(){
		var mask = mui.createMask();
		mask.show();
		$("input[type='search']").val("");
		var geolocationControl = new BMap.GeolocationControl();
		//开始定位
		geolocationControl.location();
		geolocationControl.addEventListener("locationSuccess", function(e){
			mask.close();
		    var address = '';
		    address += e.addressComponent.province;
		    address += e.addressComponent.city;
		    address += e.addressComponent.district;
		    address += e.addressComponent.street;
		    address += e.addressComponent.streetNumber;
		    var personMarker = new BMap.Marker(e.point);
		    map.addOverlay(personMarker);
		    personMarker.setLabel(new BMap.Label(address,{offset:new BMap.Size(10,10)}));
		    map.centerAndZoom(e.point,16);
		 });
		geolocationControl.addEventListener("locationError",function(e){
			alert(e.message);
		});
	}
	/*--------------------人车切换-------------------*/


	//窗口打开
	function openInfoWindow(marker,theData,vehicleId,FInnerId,trigger){
		var opts = {
			width: 210,
			height: 175,
			title: '<div><a href="javascript:void(0);">' + FInnerId + '</a></div>' // 信息窗口标题
		};
		var msg = '时间:&nbsp;'+theData.RecordTime + '</br>速度:&nbsp;' + theData.Speed + 'km/h</br>油量:&nbsp;'+theData.Oil+'L</br>方向:&nbsp;'+ $.direction(theData.Direction).name+'<br>状态:&nbsp;';
		var statusInfo = $.statusInfo(theData.StatusInfo,theData.VehicleType);
		if(statusInfo.length > 13 ){
			opts.height = opts.height + 25;
		}
		msg+=statusInfo;
		var custom = '<div style="text-align: center;"><ul><li class="trailMonitor_info_li"><a href="track_search.html">轨迹</a></li><li><a href="cars_detail.html">详情</a></li></ul></div>';
		openInfoWindowCustom(marker, msg, opts, custom, vehicleId, FInnerId, theData.it, true, trigger);
	}

	//信息加载,geo为true你地址解析,trigger为true自动弹出信息框
	function openInfoWindowCustom(markers,message,opts,custom,vehicleId,FInnerId,thsIndex,geo,trigger){
		if(markers === null){
			return;
		}
        markers.addEventListener("click",function(e){
            open(e,thsIndex);
        });
        if(trigger){
	        $(markers).click(function(e){
	        	open(e);
	        });
	        $(markers).trigger("click");
        }
        function open(e,thsIndex){
        	var point = new BMap.Point(e.target.getPosition().lng, e.target.getPosition().lat);
        	sessionStorage.setItem("track_car_finnerid",FInnerId);		//轨迹搜索页面需要的内部编号
            sessionStorage.setItem("track_car_no",vehicleId);			//轨迹回放需要的carno
			sessionStorage.setItem("detail_car_no",vehicleId);			//详情页需要的carno
			//点击标点的时候改变数据下标,以便下次请求时仍是同一辆车
			if(thsIndex){
				MultiIndex = thsIndex-1;
			}
			$("input[type='search']").val(FInnerId);
			map.setCenter(point);
            // map.panTo(point);
            if (geo) {
                geoc.getLocation(point, function (result) {
                	if(result.address.length > 12){
                		opts.height = opts.height + 25;
                	}
                    message += ('<br><a style="color:#000;">位置:&nbsp;' + result.address + '</a>' + custom);
                    map.openInfoWindow(new BMap.InfoWindow(message, opts), point);
                });
            } else {
                map.openInfoWindow(new BMap.InfoWindow(message, opts), point);
            }
        }
   	}

	//点击打开当前显示点全景图
	function panorama(){
		if("person" === UseType){
			showPanora(PersonPoint);
		}else{
			var thsData = JSON.parse(localStorage.getItem("historySearch"+user.usr + unique));
			if(!thsData){
				mui.toast("此处无全景图");
				return;
			}
			var convertor = new BMap.Convertor();
			var point = new BMap.Point(thsData.Lng,thsData.Lat);
			//转换成百度经纬度
			convertor.translate([point],1,5,function(rs){
				if(rs.status === 0){
					showPanora(rs.points[0]);
				}else{
					mui.toast("调用百度地图错误");
				}
			});
        }
	}

	//展示全景图
	function showPanora(panoraPoint){
		//获取经纬度地区全景id,使用经纬度打开全景图,若是无全景图会导致黑屏
		var panoramaService = new BMap.PanoramaService();
		panoramaService.getPanoramaByLocation(panoraPoint, function(data){
			if (data === null) {
				mui.toast("此处无全景图");
				return;
			}
			//百度api中无退出全景图api,只好另做图层进行处理
			$("#BM-panorama").show();
			$("header").show();

			$(".mui-search").hide();
			$(".trailMonitor_change").hide();
			$("#allmap").hide();
			$(".trailMonitor-change").hide();
			$(".trailMonitor-left").hide();
			$(".trailMonitor-right").hide();
			$("nav").hide();

			var PMap = new BMap.Map("BM-panorama");
			$.map_init(PMap);
			var Panorama = new BMap.Panorama('BM-panorama');
			Panorama.setPov({heading: -40, pitch: 6});
          	Panorama.setId(data.id);
		});
	}

	//初始化
	init();
	//绑定事件
	bindEvent();
});
$(function(){
	/*---------------全局变量 start---------------*/
	var unique = sessionStorage.getItem("unique");
	var domain = $.domain(unique);
	var app = "MN16040013";
	var map = new BMap.Map("allmap");
	var convertor = new BMap.Convertor();
	var loginData=sessionStorage.getItem("UserInfo");	//获取登录数据
	var loginInfo=JSON.parse(loginData);				//转换为json对象
	var usr=loginInfo.usr;								//获取用户名
	var pwd=loginInfo.UUIDPwd;							//获取密码
	/*---------------全局变量 end---------------*/

	function init(){
		if(!unique){
			mui.toast("用户唯一标识不存在,请重新登录");
			window.location.href = "login.html";
			return;
		}
		$.map_init(map);
		initCar();
	}

	/*---------------事件绑定 start---------------*/
	function bindEvent(){
		//发信息
		mui(".mui-bar-tab").on("tap","#message",function(){
			if(window.plus){									//调用手机原生发短信
				sendMessage();
			}else{												//调用后台接口发短信

			}
		});
		mui(document).on("tap",".detail-cover",function(){
			window.location.href ="trailMonitor.html";
		});
		//上传位置
		mui('.mui-bar-tab').on('tap','#location',function(){
			if(window.plus){									//调用手机原生获取地理位置
				plus.geolocation.getCurrentPosition( function(rs){
					console.log(rs.coords.longitude + rs.coords.latitude + rs.coords.altitude);
				}, function(e){
					mui.alert(e.message);
				}, {provider:"system",geocode:false});
			}else{												//百度api获取地址
				var geolocation = new BMap.Geolocation();
				geolocation.getCurrentPosition(function(r){
					if(this.getStatus() == BMAP_STATUS_SUCCESS){
						console.log(r.point.lng+r.point.lat);
					}else {
						mui.alert("failed:"+this.getStatus());
					}
				},{enableHighAccuracy: true});
			}
		});
	}
	/*---------------事件绑定 end---------------*/

	/*---------------mui start---------------*/
	if(window.plus){
		plusReady();
	}else{
		document.addEventListener('plusready',plusReady,false);
	}

	function plusReady(){
		//打电话
		mui(".cars_detail").on("tap","#tel",function(){
			var phone = $(this).text();
			if(!phone){
				mui.alert("手机号码为空");
			}else{
				plus.device.dial(phone,true);
			}
		});
	}
	/*---------------mui end---------------*/


	//数据获取
	function initCar(){
		var carNo = sessionStorage.getItem("detail_car_no");
		if(!carNo || carNo === "undefined"){
			mui.alert("车牌号为空");
			return;
		}
		$.ajax({
			type:"post",
			url:domain,
			data:{
				usr:usr,
				pwd:pwd,
				api:"getCarDetail",
				app:app,
				car:carNo
			},
			success:function(Result){
				if(Result){
					var result = JSON.parse(Result);
					if(result.success){
						var data = result.data[0];
						showData(data);
					}else{
						mui.alert(result.message);
					}
				}else{
					mui.alert("系统错误");
				}
			}
		});
	}
	//数据展示
	function showData(Data){
		$("#title").text(Data.FInnerId);
		if(Data.Online === "1"){
			$(".cars_detail_online").css('background-color','green');
			$(".cars_detail_online").text("在线" );
		}else{
			$(".cars_detail_online").css('background-color','gray');
			$(".cars_detail_online").text("离线" );
		}
		var directionAll = null;
		
		$(".cars_detail li").eq(0).find("span").text(Data.RecordTime);
		$(".cars_detail li").eq(1).find("a").text(Data.VehicleId);
		$(".cars_detail li").eq(2).find("a").text(Data.Speed);
		$(".cars_detail li").eq(3).find("a").text(Data.Mileage);
		$(".cars_detail li").eq(4).find("a").text(Data.Oil);
		$(".cars_detail li").eq(5).find("a").text($.direction(Data.Direction).name);
		$(".cars_detail li").eq(6).find("a").text($.statusInfo(Data.StatusInfo,Data.VehicleType));
		$(".cars_detail li").eq(7).find("a").text($.warnInfo(Data.WarnInfo));
		$(".cars_detail li").eq(9).find("a").text(Data.VehicleMobile);
		$.geocoder(Data.Lng,Data.Lat,function(rs){
			$(".cars_detail li").eq(8).find("a").text(rs.address);
			var marker = null;
			if(Data.WarnInfo.indexOf("1") > -1){												//报警状态
				if(Data.Speed === 0){
					marker = new BMap.Marker(rs.point,{icon:new BMap.Icon("../images/direction/warn_00.png",new BMap.Size(35,35))});
				}else{
					marker = new BMap.Marker(rs.point,{icon:new BMap.Icon($.direction(Data.Direction,"warn").img,new BMap.Size(35,35))});
				}
			} else if(Data.Online === "1"){													//在线离线状态
				if(Data.Speed === 0){														//在线停车
					marker = new BMap.Marker(rs.point,{icon:new BMap.Icon("../images/direction/park_00.png",new BMap.Size(35,35))});
				}else{																			//在线行驶
					marker = new BMap.Marker(rs.point,{icon:new BMap.Icon($.direction(Data.Direction,"online").img,new BMap.Size(35,35))});
				}
			} else if(Data.Online === "0"){													//离线状态
				if(Data.Speed === 0){													//速度为0的停止状态
					marker = new BMap.Marker(rs.point,{icon:new BMap.Icon("../images/direction/offline_00.png",new BMap.Size(35,35))});
				}else{																			//在线状态,根据方向不同定制不同图标
					marker = new BMap.Marker(rs.point,{icon:new BMap.Icon($.direction(Data.Direction,"offline").img,new BMap.Size(35,35))});
				}
			}
			map.panTo(rs.point);
			map.addOverlay(marker);
		},true);
		$(".cars_detail_user li").find("a").text(Data.UnitName);
	}

	//打电话,未使用
	function call(){

	    // 导入Activity、Intent类

	    var Intent = plus.android.importClass("android.content.Intent");

	    var Uri = plus.android.importClass("android.net.Uri");

	    // 获取主Activity对象的实例

	    var main = plus.android.runtimeMainActivity();

	    // 创建Intent

	    var uri = Uri.parse("tel:10010"); // 这里可修改电话号码

	    var call = new Intent("android.intent.action.CALL",uri);

	    // 调用startActivity方法拨打电话

	    main.startActivity( call );

	    // ...

	}

	//手机原生发送短信
	function sendMessage(){
		var msg = plus.messaging.createMessage(plus.messaging.TYPE_SMS);
		msg.to = ["13476157565"];
		msg.body = "这是一个测试";
		plus.messaging.sendMessage(msg,function(){
			mui.alert("发送成功");
		},function(){
			mui.alert("发送失败");
		});
	}

	//初始化
	init();
	//绑定事件
	bindEvent();
});
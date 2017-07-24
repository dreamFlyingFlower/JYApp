/*百度地图工具类，需先加载jquery以及百度地图api*/
(function ($) {
	var geoc = new BMap.Geocoder();
	var convertor = new BMap.Convertor();
	var PI = Math.PI;
    $.extend({
        map_init: function (map,param) {
            var defaultParam = {
                point:{
                    lng:114.3162,
                    lat:30.581084
                },                      //中心点，默认武汉
                zoom:15,                //地图级别
                city:"武汉",            //中心城市
                isScroll:true,          //是否开启鼠标滚动缩放
                isMapType:false,		//是否开启3D切换控件
                isScale:false,			//是否开启缩放
                isTraffic:false,		//是否开启交通流量图层
                isLocation:false		//是否显示定位
            };
            var params = $.extend(defaultParam,param);
            map.centerAndZoom(new BMap.Point(params.point.lng, params.point.lat), params.zoom);
            map.setCurrentCity(params.city);
            map.enableScrollWheelZoom(params.isScroll);
            if(params.isMapType){
            	map.addControl(new BMap.MapTypeControl({anchor: BMAP_ANCHOR_TOP_LEFT}));
            }
            if(params.isScale){
            	var scaleControl = new BMap.NavigationControl({
            		type:BMAP_NAVIGATION_CONTROL_ZOOM,			//控件类型
            		anchor:BMAP_ANCHOR_BOTTOM_RIGHT,			//控件位置
            		offset:new BMap.Size(5,120)				    //控件偏移量
            	});
            	map.addControl(scaleControl);
            }
            if(params.isLocation){
            	map.addControl(new BMap.GeolocationControl());
            }
            //需引入百度的traffic_min.js
            if(params.isTraffic){
            	var traffic = new BMapLib.TrafficControl();
				map.addControl(traffic);
				traffic.setAnchor(BMAP_ANCHOR_TOP_RIGHT);
            }
        },
        //百度地图信息弹窗map实例，标注点或其他对象，显示的样式内容，显示的样式
        openInfoWindow:function(map,markers,message,opts,geo){
            markers.addEventListener("click", function (e) {
                var point = new BMap.Point(e.target.getPosition().lng, e.target.getPosition().lat);
                if (geo) {
                    var geoc = new BMap.Geocoder();
                    geoc.getLocation(point, function (result) {
                        message += '<br>地址' + result.address;
                        map.openInfoWindow(new BMap.InfoWindow(message, opts), point);
                    });
                } else {
                    map.openInfoWindow(new BMap.InfoWindow(message, opts), point);
                }
            });
        },
        //百度逆地址解析
        geocoder: function (lng, lat, callback,bool) {
        	if(bool){
		        var point = new BMap.Point(lng,lat);
		        convertor.translate([point],1,5,function(rs){
		          	geoc.getLocation(rs.points[0], function (result) {
		          	    callback(result);
		          	});
		        });
        	}else{
        		geoc.getLocation(new BMap.Point(lng,lat),function(result){
        			callback(result);
        		});
        	}
        },
        //根据方向不同指定不同图标type为状态:正常,离线,报警,可不传
        direction : function(param,type) {
        	if(!type){
        		return {img:"../images/direction/park_00.png",name:"东北"};
        	}else if (param > 22.5 && param < 90 - 22.5) {
                return {img:"../images/direction/"+type+"_01.png",name:"东北"};
            }else if (param >= 90 - 22.5 && param <= 90 + 22.5) {
                return {img:"../images/direction/"+type+"_02.png",name:"正东"};
            }else if (param > 90 + 22.5 && param < 180 - 22.5) {
                return {img:"../images/direction/"+type+"_03.png",name:"东南"};
            }else if (param >= 180 - 22.5 && param <= 180 + 22.5) {
                return {img:"../images/direction/"+type+"_04.png",name:"正南"};
            }else if (param > 180 + 22.5 && param < 270 - 22.5) {
                return {img:"../images/direction/"+type+"_05.png",name:"西南"};
            }else if (param >= 270 - 22.5 && param <= 270 + 22.5) {
                return {img:"../images/direction/"+type+"_06.png",name:"正西"};
            }else if (param > 270 + 22.5 && param < 360 - 22.5) {
                return {img:"../images/direction/"+type+"_07.png",name:"西北"};
            }else {
                return {img:"../images/direction/"+type+"_08.png",name:"正北"};
            }
        },
        //将百度经纬度转换成真实经纬度
        bd_decrypt: function (lng, lat) {
            var a = 6378245.0;
            var ee = 0.00669342162296594323;
            var x_pi = PI * 3000.0 / 180.0;
            var dlng = lng - 0.0065;
            var dlat = lat - 0.006;
            var sqrt = Math.sqrt(dlng * dlng + dlat * dlat) - 0.00002 * Math.sin(dlat * x_pi);
            var theta = Math.atan2(dlat, dlng) - 0.000003 * Math.cos(dlng * x_pi);
            var Lng = sqrt * Math.cos(theta);
            var Lat = sqrt * Math.sin(theta);
            return $.transformFromGCJToWGS(Lng, Lat);
        },
        //将国家经纬度转成真实经纬度
        transformFromGCJToWGS: function (lng, lat) {
            var Lng = lng;
            var Lat = lat;
            while (true) {
                var result = $.transformFromWGSToGCJ(Lng, Lat);
                var dlng = lng - result[0];
                var dlat = lat - result[1];
                if ((Math.abs(dlat) < 0.0000001) && (Math.abs(dlng) < 0.0000001)) {
                    lngs = Lng;
                    lats = Lat;
                    break;
                }
                Lng += dlng;
                Lat += dlat;
            }
            return {lng:lngs,lat:lats};
        },
        //将真实经纬度转国家加密经纬度
        transformFromWGSToGCJ: function (lng, lat) {
            var resultArr = [];
            var a = 6378245.0;
            var ee = 0.00669342162296594323;
            var x_pi = PI * 3000.0 / 180.0;
            var dLat = $.transformLat(lng - 105, lat - 35);
            var dlng = $.transformLng(lng - 105, lat - 35);
            var radLat = lat / 180.0 * PI;
            var magic = Math.sin(radLat);
            magic = 1 - ee * magic * magic;
            var sqrtMagic = Math.sqrt(magic);
            dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * PI);
            dlng = (dlng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * PI);
            var lats = parseFloat(lat) + dLat;
            var lngs = parseFloat(lng) + dlng;
            resultArr.push(lngs);
            resultArr.push(lats);
            return resultArr;
        },
        //重新计算经度
        transformLng: function (x, y) {
            var lngResult = 0;
            lngResult = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
            lngResult = lngResult + (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
            lngResult = lngResult + (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0;
            lngResult = lngResult + (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0;
            return lngResult;
        },
        //重新计算纬度
        transformLat: function (x, y) {
            var latResult = 0;
            latResult = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
            latResult = latResult + (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
            latResult = latResult + (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0;
            latResult = latResult + (160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0;
            return latResult;
        },
        //将真实经纬度转百度经纬度
        transfromFromWGSToBDJ: function (lng, lat) {
            var a = 6378245.0;
            var ee = 0.00669342162296594323;
            var x_pi = PI * 3000.0 / 180.0;
            var lnglat = $.transformFromWGSToGCJ(lng, lat);
            var lngs = parseFloat(lnglat[0]), lats = parseFloat(lnglat[1]);
            var sqrtMagic = Math.sqrt(lngs * lngs + lats * lats) + 0.00002 * Math.sin(lats * x_pi);
            var magic = Math.atan2(lats, lngs) + 0.000003 * Math.cos(lngs * x_pi);
            var dlng = sqrtMagic * Math.cos(magic) + 0.0065;
            var dlat = sqrtMagic * Math.sin(magic) + 0.006;
            return { lng: dlng, lat: dlat };
        }
    });
})(window.jQuery);
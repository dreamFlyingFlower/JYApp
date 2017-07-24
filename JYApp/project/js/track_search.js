(function($) {
	var carNo = sessionStorage.getItem("track_car_no");
	var FInnerId = sessionStorage.getItem("track_car_finnerid");
	if(!carNo){
		mui.alert("车牌号为空");
		return;
	}else{
		document.getElementById("vehicleId").innerText = FInnerId ? FInnerId : carNo;
	}
	var beginBtn = document.getElementById("beginTime");
	var endBtn = document.getElementById("endTime");
	var time = new Date();
	var month = time.getMonth()< 9 ? "0" + (time.getMonth()+1) : time.getMonth() +1;
	var day = time.getDate() < 10 ? "0" + time.getDate() : time.getDate();
	beginBtn.innerText = time.getFullYear() + "-" + month + "-" + day + " 00:00";
	endBtn.innerText = time.getFullYear() + "-" + month + "-" + day + " 23:59";
	mui(document).on('tap','.mui-content-padded',function(e){
		var target = e.target;
		var picker = new $.DtPicker();
		if(target.id === "beginTime"){
			picker.show(function(rs){
				beginBtn.innerHTML = rs.text;
			});
		}else if(target.id === "endTime"){
			picker.show(function(rs){
				endBtn.innerHTML = rs.text;
			});
		}
	});
	var serach = document.getElementById("searchBtn");
	serach.addEventListener('tap',function(){
		var beginTime = document.getElementById("beginTime").innerText;
		var endTime = document.getElementById("endTime").innerText;
		sessionStorage.setItem("track_search",JSON.stringify( {
			car:carNo,
			begin_time:beginTime+":00",
			end_time:endTime+":59"
		}));
		window.location.href = "track_play.html";
	});
})(mui);
$(function(){
	function init(){
		setHeight();
	}

	function bindEvent(){
		//出子页面
		$("aside li a").click(function(){
			//添加某样式区别
			$(this).parent().addClass("region-active").siblings().removeClass("region-active");
			$($(this).attr("href")).show().siblings().hide();
		});
		//区域选择
		$(".region-list li div li").click(function(){
			var region = $(this).find("a").attr("data-option");
			var regionText = $(this).find("a").text();
			sessionStorage.setItem("region",region);
			sessionStorage.setItem("regionText",regionText);
			localStorage.setItem("region",JSON.stringify({region:region,regionText:regionText}));
			window.location.href = "login.html";
		});
	}

	//设置两边的高度让其各自滚动
	function setHeight(){
		var windowHeight = $(window).height();
		$("aside").height(windowHeight - 44);
		$(".region-list").height(windowHeight -44);

		//自动跳到响应的选中条目
		var localRegion = localStorage.getItem("region");
		if(localRegion && localRegion !== "undefined"){
			var localR = JSON.parse(localRegion);
			var id = "#"+localR.region.replace(/\d/g,"");
			location.href = id+1;
			$(id+1).parent().addClass("region-active").siblings().removeClass("region-active");
			$(id).show().siblings().hide();
		}
	}

	init();
	bindEvent();
});

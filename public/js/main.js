
// typed.js
$(function(){
	var s=[];
	setTimeout(function() {
		$(".title").typed({
			strings: ['Drake', 'Taylor swift',  'Thug life', 'Taco', 'friends forever', 'product hunt', 'cry', 'trump', 'terminator'],
			typeSpeed: 0,
			startDelay: 0,
			backSpeed: 0,
			backDelay: 1500,
			loop: true,
			loopCount: false,
			showCursor: false,
			cursorChar: "|",
			attr: null,
			contentType: 'html',
			callback: function() {},
			preStringTyped: function() {
				
			},
			onStringTyped: function() {
				if(s.length==9) s=[];
				s.push("okay");
				var im=s.length;
				$('.imoji').attr('src',"img/"+im+".png");
			},
			resetCallback: function() {}
		});
	},1000);
});
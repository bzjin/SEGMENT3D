window.onload = function() {
	all_imgs = [];
	for ( var i = 0; i <= 59; i++ ) {
			var imgurl = "";
		var preurl = "";
		if (i < 10){ 
			imgurl = 'slices/raw_000' + i + '.jpg'; 
			preurl = 'slices/pre_000' + i + '.jpg';}
		else { 
			imgurl = 'slices/raw_00' + i + '.jpg';
			preurl = 'slices/pre_00' + i + '.jpg';}

		make_base(imgurl);

		function make_base(imgurl) {
				base_image = new Image();
				base_image.src =  imgurl;
				var x = (i- (Math.floor(i/6)*6)) * 65;
				var y = Math.floor(i/6) * 75;

				base_image.onload = function(){
					all_imgs.push(base_image);
				}
			}
		}// end for loop
	//console.log(all_imgs)
	window.setTimeout(drawImages, 1500);

	var canvas = d3.select("#grid2d").append("canvas")
		.attr("id", "grid2d")
		.attr("width",  750)
		.attr("height", 800);

	context = canvas.node().getContext("2d");
	context.fillStyle =("white");

	context.font = "10px Effra";
	context.textAlign = "start";
	context.textBaseline = "hanging";

	function drawImages() {
		for ( var i = 0; i <= 59; i++ ) {
			var imgurl = "";
			var preurl = "";
			if (i < 10){ 
				imgurl = 'slices/raw_000' + i + '.jpg'; 
				preurl = 'slices/pre_000' + i + '.jpg';}
			else { 
				imgurl = 'slices/raw_00' + i + '.jpg';
				preurl = 'slices/pre_00' + i + '.jpg';}

		make_base(imgurl);

		var color = d3.scaleLinear()
					.domain([0, .5, 1])
					.range(["#a50026","#d9ef8b","#006837"]);

		function hexToRgb(hex) {
		    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		    return result ? {
		        r: parseInt(result[1], 16),
		        g: parseInt(result[2], 16),
		        b: parseInt(result[3], 16)
		    } : null;
		}

		//alert( hexToRgb("#0033ff").g ); // "51";

		function make_base(imgurl) {
			    var dim = 85;
			    var pad = 90;
			    var n = 8;
				base_image = new Image();
				base_image.src =  imgurl;
				var x = (i- (Math.floor(i/n)*n)) * pad;
				var y = Math.floor(i/n) * pad;

				//base_image.onload = function(){
					context.drawImage(base_image, x, y, dim, dim )

					var imgData = context.getImageData(x, y, x+dim-1, y+dim-1);
					var allcolors = [];

                for (var k=0;k<imgData.data.length;k+=4){

                	var rgb_str = "(" + imgData.data[k] + "," + imgData.data[k+1] + "," + imgData.data[k+2] + ")";
					if (allcolors.indexOf(rgb_str) == -1){
					  	allcolors.push(rgb_str)
					}

				}
				allcolors.sort();
				//console.log(allcolors); //FOR THE DEMO. Shows how many colors and which ones are in each pixel
				/*
				for (var k=0;k<imgData.data.length;k+=4){
						var m = 30;
						//var c = d3.color();
						//console.log(d3.color(color(imgData.data[k]/255)))
						if (imgData.data[k] > (m+5) && imgData.data[k] < (m+10)){
					  		imgData.data[k]= 255; //red
					  		imgData.data[k+1]= 195; 
					    	imgData.data[k+2]= 0; 
					    } else if (imgData.data[k] > m && imgData.data[k] <= (m+5)) {
					  		imgData.data[k]= 255; //red
					  		imgData.data[k+1]= 87; 
					    	imgData.data[k+2]= 51; 
					    } else if (imgData.data[k] <= m && imgData.data[k] <= (m-5)){
					    	imgData.data[k]= 199; //red
					  		imgData.data[k+1]= 0; 
					    	imgData.data[k+2]= 255;
					    }
					  	//imgData.data[k+1]= imgData.data[k+1]; //green
					  	//imgData.data[k+2]= imgData.data[k+2]; //blue
					  /*else {
					  	imgData.data[k]=255-imgData.data[k]; //red
					  	imgData.data[k+1]=255-imgData.data[k+1]; //green
					  	imgData.data[k+2]=255-imgData.data[k+2]; //blue
					  //imgData.data[k+3]= 255-imgData.data[k+3];
					  }*/ 
				//}

				//context.putImageData(imgData, x, y);	
				}
			


		}// end for loop
	} // end of drawImages

}
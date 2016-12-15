/**
jquery-img-upload v1.0.0
jQueryt图片上传插件
Copyright (c) 2016 ZhuBincong
 */
;
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["jquery"], factory);
	} else if (typeof module === "object" && module.exports) {
		module.exports = factory(require("jquery"));
	} else {
		factory(jQuery);
	}
}(function ($) {
		'use strict';
		var _config = { //默认上传配置
			url : '', //图片上传地址
			viewType : 'mobile', //视图类型
			hideBtn : false,//隐藏按钮
			maxNum : 0, //最大图片数，0为无限制
			compress : false, //是否启动压缩
			maxSize : 1024 * 1024, //单张图片最大值，ifCompress为true时有效
			maxWidth : 1024, //需要压缩时压缩图片最大宽度
			maxHeight : 1024, //需要压缩时压缩图片最大高度
			timeout : 0, //设置超时等待时间，0为不设置超时
			onsuccess : function () {}, //上传成功时回调
			onerror : function () {}, //上传失败时回调
			ondone : function () {}, //成功与否都会调用
			ontimeout : function () {}, //超时回调
			onabort : function () {} //取消上传时回调
		};
		
		var $uploadBtn,$abortBtn;
		
		var PCVIEW = "";
		//TODO

		//手机模式预览图
		var MOBILEPREVIEW = "<div class='mobile-img-preview'><img></div>";
		//手机模式添加按钮
		var MOBILEINPUTVIEW = "<div class='mobile-img-load'><div>+<input type='file' accept='image/*' class='mobil-img-inupt' multiple ></div></div>";
		//手机模式上传按钮
		var MOBILEUPLOADBTN = "<button class = 'mobile-upload-btn'>上传</button>";
		//手机模式取消上传按钮
		var MOBILEABORTBTN = "<button class = 'mobile-abort-btn'>取消上传</button>";
		//预览外框
		var PREVIEWBOX = "<div class = 'preview-box'></div>";
		//错误提示框
		var ERRMSG = "<p class='img-err-msg'></p>";
		//预览大图
		var BIGPREVIEW = "<div class='big-img-preview'><div class='full-background'></div><img><a title='删除'>×</a></div>";
		//按钮外框
		var BTNSVIEW = '<div></div>';
		//上传遮罩
		var UPLOADINGVIEW = "<div class='uploading-view'></div>";
		//上传进度条
		var UPLOADINGPROGRESS = "<div class='uploading-progress'><div></div></div>";

		$.fn.extend({
			imgUploadReady : function (config) {
				var config = $.extend({}, _config, config);
				var filesMap = {}; //暂存文件
				var xhr; //ajax对象
				var $this = $(this);
				var $previewBox = $(PREVIEWBOX);
				var $errMsg = $(ERRMSG);
				var $btnsView = $(BTNSVIEW);
				var $uploadingView = $(UPLOADINGVIEW);
				var $uploadingProgress = $(UPLOADINGPROGRESS);
				var preview, $inputView;
				//手机模式
				if (config.viewType == 'mobile') {
					preview = MOBILEPREVIEW;
					$inputView = $(MOBILEINPUTVIEW);
					$uploadBtn = $(MOBILEUPLOADBTN);
					$abortBtn = $(MOBILEABORTBTN);
				}
				//大预览图
				var $bigPreview = $(BIGPREVIEW);
				$bigPreview.click(function (e) {
					$(this).removeClass('active');
				});
				//点击X删除文件与对应预览
				$bigPreview.children('a').click(function () {
					var deleteIndex = $(this).data('index');
					delete filesMap[deleteIndex];
					$this.find('[data-index=' + deleteIndex + ']').remove();
				});
				if(config.hideBtn){
					$btnsView.hide();
				}
				//上传按钮点击
				$uploadBtn.click(function () {
					if (Object.keys(filesMap).length == 0) {
						showMsg($errMsg, "请选择图片！");
						return;
					}
					$(this).hide();
					$uploadingView.show();
					$uploadingProgress.show();
					$abortBtn.show();
					xhr = new XMLHttpRequest();
					var fd = new FormData();
					for (var x in filesMap) {
						fd.append('img[]', filesMap[x]);
					}
					xhr.open("POST", config.url, true);
					xhr.timeout = config.timeout;
					if (typeof xhr.responseType != 'undefined') {
						xhr.responseType = 'json';
					}
					//进度条控制
					xhr.upload.onprogress = function (e) {
						var progress = Math.round(e.loaded / e.total * 1000) / 10 + '%';
						$uploadingProgress.children('div').get(0).style.width = progress;
						$uploadingProgress.children('div').text(progress);
					};
					xhr.onload = function (e) {
						//清除预览与文件
						$previewBox.children('[data-index]').remove();
						filesMap = {};
						config.onsuccess(xhr.response, e);
					};
					xhr.onabort = function (e) {
						showMsg($errMsg, "上传被取消！");
						config.onabort(e);
					};
					xhr.ontimeout = function (e) {
						showMsg($errMsg, "上传超时！");
						config.ontimeout(e);
					};
					xhr.onerror = function (e) {
						showMsg($errMsg, "上传出错！");
						config.onerror(e);
					};
					xhr.onloadend = function (e) {
						//一些重置操作
						$uploadingProgress.children('div').get(0).style.width = 0;
						$uploadingProgress.children('div').text('');
						$uploadingView.hide();
						$uploadingProgress.hide();
						$abortBtn.hide();
						$uploadBtn.show();
						config.ondone(e);
					};
					xhr.send(fd);
				});
				//取消上传按钮点击
				$abortBtn.click(function () {
					xhr.abort();
					$(this).hide();
					$uploadingView.hide();
					$uploadingProgress.hide();
					$uploadBtn.show();
				});

				//添加视图
				$previewBox.append($bigPreview).append($inputView).append($errMsg).append($uploadingView).append($uploadingProgress);
				$btnsView.append($uploadBtn).append($abortBtn);
				$this.append($previewBox).append($btnsView);
				//添加图片操作
				$inputView.find('input').change(function (e) {
					//转存图片内存地址
					var fileList = e.target.files;
					var files = [];
					for (var i = 0; i < fileList.length; i++) {
						files.push(fileList[i]);
					}
					//已有图片数
					var oldNum = Object.keys(filesMap).length;
					for (var i = 0; i < files.length; i++) {
						//如果超过最大数量，超过的部分不再处理
						if (config.maxNum && !isNaN(config.maxNum) && (oldNum + i) >= config.maxNum) {
							showMsg($errMsg, "已选择的文件超过最大数量" + config.maxNum+"，超过的部分将被忽略");
							e.target.value = '';
							return;
						}
						var fr = new FileReader();
						//添加文件索引，因为使用了并发读取，须使读取器与文件对应
						fr.index = i;
						fr.onload = function (e) {
							var dataUrl = this.result;
							var thisFile = files[e.target.index];
							var imgType = thisFile.type;
							var $preview = $(preview);
							//满足压缩条件则压缩
							if (config.compress && thisFile.size > config.maxSize && imgType.search(/gif/) == -1) {
								compressImg(dataUrl, imgType, config.maxWidth, config.maxHeight,
									function (dataUrl) {
									setFiles(filesMap, $preview, $bigPreview, dataUrl, dataURLtoBlob(dataUrl));
									$inputView.before($preview);
								});
							} else {
								setFiles(filesMap, $preview, $bigPreview, dataUrl, thisFile);
								$inputView.before($preview);
							}
						}
						fr.readAsDataURL(files[i]);
					}
					e.target.value = '';
				});
			},
			imgUploadAction : function(){
				$uploadBtn.click();
			},
			imgUploadAbort : function(){
				$abortBtn.click();
			}
		});
		function showMsg($dom, str) {
			$dom.text(str).fadeIn();
			setTimeout(function () {
				$dom.fadeOut();
			}, 3000);
		};

		//压缩图片方法
		function compressImg(imgData, imgType, maxWidth, maxHeight, callback) {
			if (!imgData)
				return;
			callback = callback || function (res) {
				return res
			};
			//设置图片类型
			if (!String.prototype.startsWith) {
				imgType = imgType || "image/jpeg"; //默认图片类型
			} else {
				if (!imgType || !imgType.startsWith('image/')) {
					if (imgData.startsWith('data:image/')) {
						imgType = imgData.slice(imgData.indexOf(':') + 1, imgData.indexOf(';'));
					} else {
						imgType = "image/jpeg"; //默认图片类型
					}
				} else if (imgType == "image/bmp") {
					imgType = "image/jpeg"; //改bmp类型为jpg
				}
			}
			maxHeight = maxHeight || 1024; //默认最大高度
			maxWidth = maxWidth || 1024; //默认最大宽度
			var canvas = document.createElement('canvas');
			var img = new Image();

			img.onload = function () {
				if (img.height > maxHeight) { //按最大高度等比缩放
					img.width *= maxHeight / img.height;
					img.height = maxHeight;
				}
				if (img.width > maxWidth) { //按最大宽度等比缩放
					img.height *= maxWidth / img.width;
					img.width = maxWidth;
				}
				var ctx = canvas.getContext("2d");
				canvas.width = img.width;
				canvas.height = img.height;
				ctx.clearRect(0, 0, canvas.width, canvas.height); // canvas清屏
				ctx.drawImage(img, 0, 0, img.width, img.height); // 将图像绘制到canvas上
				callback(canvas.toDataURL(imgType)); //必须等压缩完才读取canvas值，否则canvas内容是黑帆布
			};
			// 必须先绑定事件，才能设置src属性，否则img没内容可以画到canvas
			img.src = imgData;
		};

		//dataUrl转换为Blob方法
		function dataURLtoBlob(dataUrl) {
			var arr = dataUrl.split(','),
			mime = arr[0].match(/:(.*?);/)[1],
			bstr = atob(arr[1]),
			n = bstr.length,
			u8arr = new Uint8Array(n);
			while (n--) {
				u8arr[n] = bstr.charCodeAt(n);
			}
			return new Blob([u8arr], {
				type : mime
			});
		};

		function setFiles(filesMap, $preview, $bigPreview, dataUrl, file) {
			//已有文件最后的索引
			var oldIndex = Object.keys(filesMap)[Object.keys(filesMap).length - 1];
			var fileIndex = typeof oldIndex == 'undefined' ? 0 : parseInt(oldIndex) + 1;
			$preview.attr('data-index', fileIndex);
			$preview.children('img').click(function (e) {
				$bigPreview.addClass('active');
				$bigPreview.children('a').data('index', fileIndex);
				$bigPreview.children('img').attr('src', dataUrl);
			});
			$preview.children('img').attr('src', dataUrl);
			filesMap[fileIndex] = file;
		}
	}));

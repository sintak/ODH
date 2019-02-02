// by sintaK 2019年1月26日
class ODHComm {
    constructor() {
        // // content.js
        // var installNode = document.createElement('div');
        // installNode.id = 'my-chrome-extension-installed';
        // installNode.style.display = 'none';
        // installNode.setAttribute('version', chrome.runtime.getManifest().version); // 把版本号放到属性里
        // installNode.innerText=JSON.stringify({key: 'value'}); // 把通信的data放到标签的html text里面
        // document.body.appendChild(installNode);



        // // 监听installNode的EventFromChrome事件
        // installNode.addEventListener('EventFromChrome', function() {
        //     var data = JSON.parse(installNode.innerText);
        //     console.log(data.msg);
        // });

        this.init();

        
        this.contentId = parseInt(Math.random() * 10000);
        this.port = null;

        this.log('Enter comm.js, contentId = ' + this.contentId);
    }
    
    //打日志函数
    log(text){
        window.console && console.log('[' + (Date()) +  '][comm.js][ ' + this.contentId + ']' + text);
    }

    init() {
        //---------------------------------------content.js与网页交互---------------------------------------//
        //监听网页事件
        //eventMsg:{detail:{type:0, param:{cmd:"", param:{result:0, message:""}}}}
        document.addEventListener("PageEvent", (eventMsg) => this.onPageEvent(eventMsg), false);
    }

    onPageEvent(eventMsg) {
        var detail = eventMsg.detail;
        this.log('PageEvent: detail = ' + JSON.stringify(detail));
        
        if(detail.type == 0){
            switch(detail.param.cmd){
                case 'connect':
                    this.connect(detail, function(result, message){
                        this.log('PageEvent:connect: result = ' + result + ', message = ' + JSON.stringify(message));
                        if(result){
                            this.dispatchPageEvent(message);
                        }else{
                            this.dispatchPageEvent({
                                type : 0,
                                param : {
                                    cmd : 'connect_result',
                                    param : {
                                        result : result,
                                        message : message
                                    }
                                }
                            })
                        }
                    });
                    break;
                case 'disconnect':
                    this.disconnect();
                    break;
            }
        }else{
            //其他消息通通给background
            this.sendMessageToBackground(detail);
        }
    }

    // 触发网页事件
    // eventMsg:{type:0, param:{cmd:"", param:{result:0, message:"", host:""}}}
    // type: 0=content_script通讯时件, 1=background通讯事件 7=ankiconnect事件
    dispatchPageEvent(eventMsg) {
        
        this.log('dispatchPageEvent: eventMsg.type = ' + eventMsg.type);
        
        var e = document.createEvent('CustomEvent');
        e.initCustomEvent('ContentEvent', true, true, eventMsg);
        document.dispatchEvent(e);
        
        // // content.js
        // // ...接上面的代码
        // // 创建一个事件，表示从Chrome发送消息给网页
        // var eventFromChrome = document.createEvent('Event');
        // eventFromChrome.initEvent('EventFromChrome', true, true);
        // // 修改installNode的innerText把需要发送的消息内容放在里面
        // // installNode.innerText = JSON.stringify({type: 'HELLO', msg: 'FMVP is nothing for me'});
        // // eventMsg:{detail:{type:0, param:{cmd:"", param:{result:0, message:""}}}}
        // // {action:'addNote',params:{notedef}}
        // installNode.innerText = JSON.stringify(
        //     {type:0, param: eventMsg});
        // // 发出事件
        // installNode.dispatchEvent(eventFromChrome);
    }

    //---------------------------------------content.js与background.js交互---------------------------------------//
    //连接background.js
    connect(msg, callbackFunc){
        log("connect: Enter")
        if(this.port){
            return;
        }

        //超时当作失败，联调中，先不设超时
        var timer;
        // timer = setTimeout(function(){
        // 	if(port){
        // 		port.disconnect();
        // 		port = null;
        // 	}
        // 	callbackFunc && callbackFunc(false, 'connect timeout');
        // },5000);

        //Attempts to connect to connect listeners within an extension/app (such as the background page), or other extensions/apps.
        this.port = chrome.runtime.connect({name: "port" + contentId});
        
        //监听连接断开事件
        this.port.onDisconnect.addListener(function() {
            log("connect:onDisconnect: Enter");

            //清空定时器
            if(timer){
                clearTimeout(timer);
                timer = null;
            }

            var connected = this.port.connected;
            this.port = null;

            if(connected){
                //连上又断开
                dispatchPageEvent({
                    type : 0,
                    param : {
                        cmd : 'closed',
                        param : {
                            message : chrome.runtime.lastError && chrome.runtime.lastError.message
                        }
                    }
                });
            }else{
                //没连上
                callbackFunc && callbackFunc(false, 'connect error: '+(chrome.runtime.lastError && chrome.runtime.lastError.message));
            }
        });
        //监听background.js消息
        this.port.onMessage.addListener(function(message) {
            log("connect:onMessage: message = " + JSON.stringify(message));

            if(message.type == 0){
                //连接成功，不算正式消息
                log("connect:onMessage: connected succ");

                //清空定时器
                if(timer){
                    clearTimeout(timer);
                    timer = null;
                }

                this.port.connected = true;
                callbackFunc && callbackFunc(true, message);
            }else{
                dispatchPageEvent(message);
            }
        });
        
        //发连接消息到background.js
        sendMessageToBackground(msg);
    }
    //断开与background.js的连接
    disconnect(){
        log("connect:onMessage: Enter");
        if(!this.port){
            return;
        }
        
        this.port.disconnect();
        this.port = null;
    }
        
    //发送消息到background.js
    sendMessageToBackground(msg){
        this.log("sendMessageToBackground: Enter");
        if(!this.port){
            return;
        }

        this.port.postMessage(msg);
    }
}

window.odhcomm = new ODHComm();
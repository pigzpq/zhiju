/*
 * Ext JS Library 2.0
 * Copyright(c) 2006-2007, Ext JS, LLC.
 * licensing@extjs.com
 * 
 * http://extjs.com/license
 */

Ext.EventManager=function(){var T,M,I=false;var K,S,C,O;var L=Ext.lib.Event;var N=Ext.lib.Dom;var B=function(){if(!I){I=true;Ext.isReady=true;if(M){clearInterval(M)}if(Ext.isGecko||Ext.isOpera){document.removeEventListener("DOMContentLoaded",B,false)}if(Ext.isIE){var D=document.getElementById("ie-deferred-loader");if(D){D.onreadystatechange=null;D.parentNode.removeChild(D)}}if(T){T.fire();T.clearListeners()}}};var A=function(){T=new Ext.util.Event();if(Ext.isGecko||Ext.isOpera){document.addEventListener("DOMContentLoaded",B,false)}else{if(Ext.isIE){document.write("<s"+"cript id=\"ie-deferred-loader\" defer=\"defer\" src=\"/"+"/:\"></s"+"cript>");var D=document.getElementById("ie-deferred-loader");D.onreadystatechange=function(){if(this.readyState=="complete"){B()}}}else{if(Ext.isSafari){M=setInterval(function(){var E=document.readyState;if(E=="complete"){B()}},10)}}}L.on(window,"load",B)};var R=function(E,U){var D=new Ext.util.DelayedTask(E);return function(V){V=new Ext.EventObjectImpl(V);D.delay(U.buffer,E,null,[V])}};var P=function(V,U,D,E){return function(W){Ext.EventManager.removeListener(U,D,E);V(W)}};var F=function(D,E){return function(U){U=new Ext.EventObjectImpl(U);setTimeout(function(){D(U)},E.delay||10)}};var J=function(U,E,D,Y,X){var Z=(!D||typeof D=="boolean")?{}:D;Y=Y||Z.fn;X=X||Z.scope;var W=Ext.getDom(U);if(!W){throw"Error listening for \""+E+"\". Element \""+U+"\" doesn't exist."}var V=function(b){b=Ext.EventObject.setEvent(b);var a;if(Z.delegate){a=b.getTarget(Z.delegate,W);if(!a){return }}else{a=b.target}if(Z.stopEvent===true){b.stopEvent()}if(Z.preventDefault===true){b.preventDefault()}if(Z.stopPropagation===true){b.stopPropagation()}if(Z.normalized===false){b=b.browserEvent}Y.call(X||W,b,a,Z)};if(Z.delay){V=F(V,Z)}if(Z.single){V=P(V,W,E,Y)}if(Z.buffer){V=R(V,Z)}Y._handlers=Y._handlers||[];Y._handlers.push([Ext.id(W),E,V]);L.on(W,E,V);if(E=="mousewheel"&&W.addEventListener){W.addEventListener("DOMMouseScroll",V,false);L.on(window,"unload",function(){W.removeEventListener("DOMMouseScroll",V,false)})}if(E=="mousedown"&&W==document){Ext.EventManager.stoppedMouseDownEvent.addListener(V)}return V};var G=function(E,U,Z){var D=Ext.id(E),a=Z._handlers,X=Z;if(a){for(var V=0,Y=a.length;V<Y;V++){var W=a[V];if(W[0]==D&&W[1]==U){X=W[2];a.splice(V,1);break}}}L.un(E,U,X);E=Ext.getDom(E);if(U=="mousewheel"&&E.addEventListener){E.removeEventListener("DOMMouseScroll",X,false)}if(U=="mousedown"&&E==document){Ext.EventManager.stoppedMouseDownEvent.removeListener(X)}};var H=/^(?:scope|delay|buffer|single|stopEvent|preventDefault|stopPropagation|normalized|args|delegate)$/;var Q={addListener:function(U,D,W,V,E){if(typeof D=="object"){var Y=D;for(var X in Y){if(H.test(X)){continue}if(typeof Y[X]=="function"){J(U,X,Y,Y[X],Y.scope)}else{J(U,X,Y[X])}}return }return J(U,D,E,W,V)},removeListener:function(E,D,U){return G(E,D,U)},onDocumentReady:function(U,E,D){if(I){T.addListener(U,E,D);T.fire();T.clearListeners();return }if(!T){A()}T.addListener(U,E,D)},onWindowResize:function(U,E,D){if(!K){K=new Ext.util.Event();S=new Ext.util.DelayedTask(function(){K.fire(N.getViewWidth(),N.getViewHeight())});L.on(window,"resize",this.fireWindowResize,this)}K.addListener(U,E,D)},fireWindowResize:function(){if(K){if((Ext.isIE||Ext.isAir)&&S){S.delay(50)}else{K.fire(N.getViewWidth(),N.getViewHeight())}}},onTextResize:function(V,U,D){if(!C){C=new Ext.util.Event();var E=new Ext.Element(document.createElement("div"));E.dom.className="x-text-resize";E.dom.innerHTML="X";E.appendTo(document.body);O=E.dom.offsetHeight;setInterval(function(){if(E.dom.offsetHeight!=O){C.fire(O,O=E.dom.offsetHeight)}},this.textResizeInterval)}C.addListener(V,U,D)},removeResizeListener:function(E,D){if(K){K.removeListener(E,D)}},fireResize:function(){if(K){K.fire(N.getViewWidth(),N.getViewHeight())}},ieDeferSrc:false,textResizeInterval:50};Q.on=Q.addListener;Q.un=Q.removeListener;Q.stoppedMouseDownEvent=new Ext.util.Event();return Q}();Ext.onReady=Ext.EventManager.onDocumentReady;Ext.onReady(function(){var B=Ext.getBody();if(!B){return }var A=[Ext.isIE?"ext-ie "+(Ext.isIE6?"ext-ie6":"ext-ie7"):Ext.isGecko?"ext-gecko":Ext.isOpera?"ext-opera":Ext.isSafari?"ext-safari":""];if(Ext.isMac){A.push("ext-mac")}if(Ext.isLinux){A.push("ext-linux")}if(Ext.isBorderBox){A.push("ext-border-box")}if(Ext.isStrict){var C=B.dom.parentNode;if(C){C.className+=" ext-strict"}}B.addClass(A.join(" "))});Ext.EventObject=function(){var B=Ext.lib.Event;var A={63234:37,63235:39,63232:38,63233:40,63276:33,63277:34,63272:46,63273:36,63275:35};var C=Ext.isIE?{1:0,4:1,2:2}:(Ext.isSafari?{1:0,2:1,3:2}:{0:0,1:1,2:2});Ext.EventObjectImpl=function(D){if(D){this.setEvent(D.browserEvent||D)}};Ext.EventObjectImpl.prototype={browserEvent:null,button:-1,shiftKey:false,ctrlKey:false,altKey:false,BACKSPACE:8,TAB:9,RETURN:13,ENTER:13,SHIFT:16,CONTROL:17,ESC:27,SPACE:32,PAGEUP:33,PAGEDOWN:34,END:35,HOME:36,LEFT:37,UP:38,RIGHT:39,DOWN:40,DELETE:46,F5:116,setEvent:function(D){if(D==this||(D&&D.browserEvent)){return D}this.browserEvent=D;if(D){this.button=D.button?C[D.button]:(D.which?D.which-1:-1);if(D.type=="click"&&this.button==-1){this.button=0}this.type=D.type;this.shiftKey=D.shiftKey;this.ctrlKey=D.ctrlKey||D.metaKey;this.altKey=D.altKey;this.keyCode=D.keyCode;this.charCode=D.charCode;this.target=B.getTarget(D);this.xy=B.getXY(D)}else{this.button=-1;this.shiftKey=false;this.ctrlKey=false;this.altKey=false;this.keyCode=0;this.charCode=0;this.target=null;this.xy=[0,0]}return this},stopEvent:function(){if(this.browserEvent){if(this.browserEvent.type=="mousedown"){Ext.EventManager.stoppedMouseDownEvent.fire(this)}B.stopEvent(this.browserEvent)}},preventDefault:function(){if(this.browserEvent){B.preventDefault(this.browserEvent)}},isNavKeyPress:function(){var D=this.keyCode;D=Ext.isSafari?(A[D]||D):D;return(D>=33&&D<=40)||D==this.RETURN||D==this.TAB||D==this.ESC},isSpecialKey:function(){var D=this.keyCode;return(this.type=="keypress"&&this.ctrlKey)||D==9||D==13||D==40||D==27||(D==16)||(D==17)||(D>=18&&D<=20)||(D>=33&&D<=35)||(D>=36&&D<=39)||(D>=44&&D<=45)},stopPropagation:function(){if(this.browserEvent){if(this.browserEvent.type=="mousedown"){Ext.EventManager.stoppedMouseDownEvent.fire(this)}B.stopPropagation(this.browserEvent)}},getCharCode:function(){return this.charCode||this.keyCode},getKey:function(){var D=this.keyCode||this.charCode;return Ext.isSafari?(A[D]||D):D},getPageX:function(){return this.xy[0]},getPageY:function(){return this.xy[1]},getTime:function(){if(this.browserEvent){return B.getTime(this.browserEvent)}return null},getXY:function(){return this.xy},getTarget:function(E,G,D){var F=Ext.get(this.target);return E?F.findParent(E,G,D):(D?F:this.target)},getRelatedTarget:function(){if(this.browserEvent){return B.getRelatedTarget(this.browserEvent)}return null},getWheelDelta:function(){var D=this.browserEvent;var E=0;if(D.wheelDelta){E=D.wheelDelta/120}else{if(D.detail){E=-D.detail/3}}return E},hasModifier:function(){return((this.ctrlKey||this.altKey)||this.shiftKey)?true:false},within:function(E,F){var D=this[F?"getRelatedTarget":"getTarget"]();return D&&Ext.fly(E).contains(D)},getPoint:function(){return new Ext.lib.Point(this.xy[0],this.xy[1])}};return new Ext.EventObjectImpl()}();
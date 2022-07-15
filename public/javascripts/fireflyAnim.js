import {gsap, TweenLite, ScrollTrigger, Draggable, Flip, MotionPathPlugin } from "../gsap/all.js";

var MOUSE_X;
var MOUSE_Y;

document.addEventListener("DOMContentLoaded", () => {
    document.addEventListener("mousemove", function(e) {
        MOUSE_X = e.clientX;
        MOUSE_Y = e.clientY;
    });
    
    document.addEventListener("mouseleave", function(e) {
        MOUSE_X = undefined;
        MOUSE_Y = undefined;
    });

    // don't forget to register plugins
    gsap.registerPlugin(ScrollTrigger, Draggable, Flip, MotionPathPlugin); 

    var total = 40;
    var container = document.getElementById('app');
    var w = window.innerWidth;
    var h = window.innerHeight;
    var fireflies = [];

    for (var i=total;i--;){ 
        let newFirefly = document.createElement('div');
        newFirefly.classList.add("dot");
        container.appendChild(newFirefly);
        fireflies.push(newFirefly);

        gsap.set(newFirefly, {
            x: R(w),
            y: R(h),
            opacity: 0
        });

        MoveAnim(newFirefly);
        GlowAnim(newFirefly, oneOrZero());
    };

    function MoveAnim(newFirefly) {
        var thisMotion;
        var thisScale;
        if (R(10) > 0 && MOUSE_X != 0 && MOUSE_X != undefined){
            // interact with mouse
            thisMotion = [{x:MOUSE_X,y:MOUSE_Y},{x:R(w),y:R(h)}];
            thisScale = R(0.2)+1.0;
        } else {
            thisMotion = [{x:R(w),y:R(h)},{x:R(w),y:R(h)}];
            thisScale = R(1.2)+0.2;
        }

        gsap.to(newFirefly, {
            motionPath: thisMotion,
            duration: R(5)+10,
            scale: thisScale,
            onComplete: MoveAnim,
            onCompleteParams: [newFirefly]
        });
    }

    function GlowAnim(newFirefly, lastOpacity) {
        var thisDelay = 0;
        if (lastOpacity == 1){ thisDelay = R(7); }
        gsap.to(newFirefly, {
            duration: 1.0,
            opacity: lastOpacity,
            delay: thisDelay,
            onComplete: GlowAnim,
            onCompleteParams: [newFirefly, 1-lastOpacity]
        });
    }
});

function R(max){return Math.random()*max};
function oneOrZero(){ return Math.floor(Math.random()*2); };
const socket = io('/');
const myVideo = document.createElement('video');
const videoGrid = document.getElementById('video-grid');
const msg = document.getElementById('chat_message');
const msgList = document.getElementById('mesasge_list');
var myId = ""; 
var room= ""; 
myVideo.muted = true; //muting ourselves so that we wont get out own voice playback

//need to connect new peer connection
const myPeer = new Peer()

let myVideoStream;

myPeer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id, USERNAME); //emitting this to server to catch 'join-room' 
    myId = id;
})

//get user video and audio
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    addVideoStream(myVideo, stream, USERNAME);
    myVideoStream = stream;
    myPeer.on('call', call => {
        call.answer(stream);
        const video = document.createElement('video');
        video.id = call.peer;
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream);
        })
    })
    //when new user get connected
    socket.on('user-connected', (userId) => {
        connectToNewUser(userId, stream); //passing new user id to connect
       
    })

    socket.on('createMessage', (message, userId, username) => {
        let li = document.createElement('li');
        // console.log(myId); 
        // console.log(userId); 
      if(userId == myId) { li.innerHTML = `
       <div style = "color :red; font-size: 15px">
          ${"<span>" + username + "</span>" + ":"}
            <div><span style = "color : white; font-size: 12px">${message}<span></div>
        </div>`;}
        else { 
            li.innerHTML = `
       <div style = "color : MediumAquaMarine; font-size: 15px">
          ${"<span>" + username + "</span>" + ":"}
            <div><span style = "color : white; font-size: 12px">${message}<span></div>
        </div>`;
        }
      //  li.textContent = username + ":  " + message;
        li.className = "message";
        msgList.appendChild(li);
        
        scrollBottom();
    })

    socket.on("user-connected", (newId , name) => {
        let li = document.createElement('li');
        // console.log(myId); 
        // console.log(userId); 
        
      li.innerHTML = `
       <div style = "color :magenta; font-size: 13px">
          ${"<span>" + name + " has joined"+ "</span>"}
           </div>`;
       
        li.className = "message";
        msgList.appendChild(li);
        
        scrollBottom();
       
    });
    
 
       
    

    msg.addEventListener('keydown', (e) => {
        let text = msg.value;
        let key = e.key, keyCode = e.keyCode;
        if ((key && 'Enter' === key || keyCode && 13 === keyCode) && text.trim() !== "") {
            socket.emit('message', text, USERNAME);
            msg.value = '';
        }
    })
    socket.on('user-disconnected', userId => {
        removeUserFromChat(userId)
    })
    socket.on('user-left', (userId, USERNAME) => {
        let li = document.createElement('li');
        // console.log(myId); 
        console.log(USERNAME); 
        // console.log(userId); 
      li.innerHTML = `
       <div style = "color :magenta; font-size: 13px">
          ${"<span>" + USERNAME + " has left"+ "</span>"}
           </div>`;
       
        li.className = "message";
        msgList.appendChild(li);
        
        scrollBottom();

    })
  
 
})


// socket.on('participants', (users) => {
//     // const container = document.querySelector(".main__users__box");
//     console.log(10); 
      
  
//  const pList = document.getElementById('users');
//     let li = document.createElement('li');
//     // console.log(myId); 
//     // console.log(userId); 
//     users.forEach((user) => {
//   li.innerHTML = `
//    <div style = "color :magenta; font-size: 13px">
//       ${"<span>" + "hii" + " has joined"+ "</span>"}
//        </div>`;
   
//     li.className = "user";
//     pList.appendChild(li); }); 
    
//     scrollBottom();

    
// });   
const connectToNewUser = (userId, stream, USERNAME) => {
    const call = myPeer.call(userId, stream);
    const video = document.createElement('video');
    video.id = userId;
    call.on('stream', (userVideoStream) => {
        addVideoStream(video, userVideoStream, USERNAME);
    })

}

const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();   //after load of video play that
    })
    //add video in grid
    videoGrid.append(video);
}

const leaveChat = (userId, stream) => {
     
    removeUserFromChat(userId)
}
const removeUserFromChat = (userId) => {
   
    for (var value of videoGrid.childNodes.keys()) {
        videoGrid.childNodes[value].id == userId ? videoGrid.removeChild(videoGrid.childNodes[value]) : null
    }
}

const scrollBottom = () => {
    const scrollToHeight = document.getElementsByClassName("main__chat_window")[0].scrollHeight
    document.getElementsByClassName("main__chat_window")[0].scrollTo(0, scrollToHeight);
}

const muteToggle = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    enabled ? [myVideoStream.getAudioTracks()[0].enabled = false, setUnmuteButton()] : [myVideoStream.getAudioTracks()[0].enabled = true, setMuteButton()];
}

const setMuteButton = () => {
    const html = `<i class="fas fa-microphone"></i><span>Mute</span>`
    document.querySelector('.main__mute_button').innerHTML = html;
}
const setUnmuteButton = () => {
    const html = `<i class="unmute fas fa-microphone-slash"></i><span>Unmute</span>`
    document.querySelector('.main__mute_button').innerHTML = html;
}

const videoStreamToggle = () => {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    enabled ? [myVideoStream.getVideoTracks()[0].enabled = false, setVideoDisable()] : [myVideoStream.getVideoTracks()[0].enabled = true, seVideoEnable()];
}
const seVideoEnable = () => {
    const html = `<i class="fas fa-video"></i><span>Stop Video</span>`
    document.querySelector('.main__video_button').innerHTML = html;
}
const setVideoDisable = () => {
    const html = `<i class="unmute fas fa-video-slash"></i><span>Play Video</span>`
    document.querySelector('.main__video_button').innerHTML = html;
}
const quitRoom = () => {
    
    if(window.confirm('Are you sure?')) {
        window.alert('Closing window')
        window.open('', '_self')
        window.close();
        socket.emit('leave-room', USERNAME);
        myPeer.destroy();
       }
       else {
        alert('Cancelled!')
       }
  
}
var activeSreen = "";
const isHidden = (screen) => screen.classList.contains("screen-hide");
const handleScreen = (screen) => {
    const left_container = document.querySelector(".main__left");
    const usersScreen = document.getElementById("users-screen");
    
        handleActive("users-btn");
        if (activeSreen === "") {
            usersScreen.classList.remove("screen-hide");
            activeSreen = "users";
        } else if (activeSreen === "users") {
            usersScreen.classList.add("screen-hide");
            activeSreen = "";
        } else {
            usersScreen.classList.remove("screen-hide");
            chatScreen.classList.add("screen-hide");
            activeSreen = "users";
              }
    

};
const handleActive = (buttonClass) => {
    const button = document.querySelector(`.${buttonClass}`);
    const active = button.classList.contains("active-btn");

    if (active) button.classList.remove("active-btn");
    else button.classList.add("active-btn");
};


const handleInvite = () => { 
  prompt("Copy to clipboard: Ctrl+C, Enter", "http://localhost:8000/" + ROOM_ID);
}

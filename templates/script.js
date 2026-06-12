function updateDots(strength){

    let dots = "";

    for(let i = 1; i <= 5; i++){

        if(i <= strength){
            dots += "● ";
        }
        else{
            dots += "○ ";
        }

    }

    document.getElementById("dots").innerHTML = dots;
    document.getElementById("strengthText").innerHTML =
        strength + "/5";
}

function loadData(){

    fetch("/data")
    .then(response => response.json())
    .then(data => {

        if(data.error){
            alert(data.error);
            return;
        }

        document.getElementById("signal").innerHTML =
            data.signal;

        document.getElementById("winrate").innerHTML =
            data.win_rate + "%";

        updateDots(data.strength);

        const circle =
            document.querySelector(".signal-circle");

        if(data.signal === "BUY"){

            document.getElementById("arrow").innerHTML = "⬆";

            circle.style.background =
                "#16a34a";

        }else{

            document.getElementById("arrow").innerHTML = "⬇";

            circle.style.background =
                "#dc2626";
        }

    })
    .catch(error => {

        console.error(error);

        alert("Server connection failed");

    });

}
window.onload = function(){
    loadData();
};
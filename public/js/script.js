
function cek_jumlah() {
    const objTo = document.getElementById('verifikasi')
    const divtest = document.createElement("div");
    divtest.innerHTML = `<div class="form-group"><label for="exampleFormControlInput1">Credit :</label><input type="text" class="form-control" name="jumlahInput" value="${ input }"></div>`;

    objTo.appendChild(divtest)
}


const edit = document.getElementById('edit');

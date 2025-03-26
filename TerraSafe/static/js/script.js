document.getElementById('uploadForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const fileInput = document.getElementById('imageInput');
    const file = fileInput.files[0];
    
    if (file) {
        const formData = new FormData();
        formData.append('image', file);
        
        fetch('/detect', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            const status = document.getElementById('status');
            const hotspots = document.getElementById('hotspots');
            
            if (data.detected) {
                status.textContent = 'Elephant detected!';
                hotspots.innerHTML = '<h3>Hotspots:</h3>';
                data.hotspots.forEach(spot => {
                    hotspots.innerHTML += `<p>Lat: ${spot.lat}, Lon: ${spot.lon}</p>`;
                });
            } else {
                status.textContent = 'No elephant detected.';
                hotspots.innerHTML = '';
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
});
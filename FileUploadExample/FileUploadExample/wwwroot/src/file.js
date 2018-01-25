var account = document.getElementById('account').value;
var sas = document.getElementById('sas').value;
var container = '';
var blobUri = '';

function checkParameters() {
    account = document.getElementById('account').value;
    sas = document.getElementById('sas').value;

    if (account == null || account.length < 1) {
        alert('Please enter a valid storage account name!');
        return false;
    }
    if (sas == null || sas.length < 1) {
        alert('Please enter a valid SAS Token!');
        return false;
    }

    return true;
}

function getSasToken() {
    $.get("http://localhost:13047/api/Storage/", function (data) {
        $('#account').val('jwfileuploadtest');
        $("#sas").val(data);
        console.log("Load was performed.");
    });
}

function getBlobService() {
    if (!checkParameters())
        return null;

    blobUri = 'https://' + account + '.blob.core.windows.net';
    var blobService = AzureStorage.createBlobServiceWithSas(blobUri, sas).withFilter(new AzureStorage.ExponentialRetryPolicyFilter());
    return blobService;
}

function refreshContainer() {
    var blobService = getBlobService();
    if (!blobService)
        return;

    document.getElementById('containers').innerHTML = 'Loading...';
    blobService.listContainersSegmented(null, function (error, results) {
        if (error) {
            alert('List container error, please open browser console to view detailed error');
            console.log(error);
        } else {
            var output = [];
            output.push('<tr>',
                '<th>ContainerName</th>',
                '<th>ContainerETag</th>',
                '<th>LastModified</th>',
                '<th>Operations</th>',
                '</tr>');
            if (results.entries.length < 1) {
                output.push('<tr><td>Empty results...</td></tr>');
            }
            for (var i = 0, container; container = results.entries[i]; i++) {
                output.push('<tr>',
                    '<td>', container.name, '</td>',
                    '<td>', container.etag, '</td>',
                    '<td>', container.lastModified, '</td>',
                    '<td>', 
                    '<button class="btn btn-xs btn-success" onclick="viewContainer(\'', container.name, '\')">Select</button>', '</td>',
                    '</tr>');
            }
            document.getElementById('containers').innerHTML = '<table class="table table-condensed table-bordered">' + output.join('') + '</table>';
        }
    });
}

function viewContainer(selectedContainer) {
    container = selectedContainer;
    document.getElementById('container').value = container;
    alert('Selected ' + container + ' !');
    refreshBlobList();
}

function refreshBlobList() {
    var blobService = getBlobService();
    if (!blobService)
        return;

    document.getElementById('result').innerHTML = 'Loading...';
    blobService.listBlobsSegmented(container, null, function (error, results) {
        if (error) {
            alert('List blob error, please open browser console to view detailed error');
            console.log(error);
        } else {
            var output = [];
            output.push('<tr>',
                '<th>BlobName</th>',
                '<th>ContentLength</th>',
                '<th>LastModified</th>',
                '<th>Operations</th>',
                '</tr>');
            if (results.entries.length < 1) {
                output.push('<tr><td>Empty results...</td></tr>');
            }
            for (var i = 0, blob; blob = results.entries[i]; i++) {
                output.push('<tr>',
                    '<td>', blob.name, '</td>',
                    '<td>', blob.contentLength, '</td>',
                    '<td>', blob.lastModified, '</td>',
                    '<td>', '<button class="btn btn-xs btn-danger" onclick="deleteBlob(\'', blob.name, '\')">Delete</button> ',
                    '<a class="btn btn-xs btn-success" href="', blobUri + '/' + container + '/' + blob.name + sas, '" download>Download</a>', '</td>',
                    '</td>',
                    '</tr>');
            }
            document.getElementById('result').innerHTML = '<table class="table table-condensed table-bordered">' + output.join('') + '</table>';
        }
    });
}

function deleteBlob(blob) {
    var blobService = getBlobService();
    if (!blobService)
        return;

    blobService.deleteBlobIfExists(container, blob, function (error, result) {
        if (error) {
            alert('Delete blob failed, open brower console for more detailed info.');
            console.log(error);
        } else {
            alert('Delete ' + blob + ' successfully!');
            refreshBlobList();
        }
    });
}

function displayProcess(process) {
    document.getElementById("progress").style.width = process + '%';
    document.getElementById("progress").innerHTML = process + '%';
}

function uploadBlobByStream(checkMD5) {
    var files = document.getElementById('files').files;
    if (!files.length) {
        alert('Please select a file!');
        return;
    }
    var file = files[0];

    var blobService = getBlobService();
    if (!blobService)
        return;

    var btn = document.getElementById("upload-button");
    btn.disabled = true;
    btn.innerHTML = "Uploading";

    // Make a smaller block size when uploading small blobs
    var blockSize = file.size > 1024 * 1024 * 32 ? 1024 * 1024 * 4 : 1024 * 512;
    var options = {
        storeBlobContentMD5: checkMD5,
        blockSize: blockSize
    };
    blobService.singleBlobPutThresholdInBytes = blockSize;

    var finishedOrError = false;
    var speedSummary = blobService.createBlockBlobFromBrowserFile(container, file.name, file, options, function (error, result, response) {
        finishedOrError = true;
        btn.disabled = false;
        btn.innerHTML = "UploadBlob";
        if (error) {
            alert('Upload filed, open brower console for more detailed info.');
            console.log(error);
            displayProcess(0);
        } else {
            displayProcess(100);
            setTimeout(function () { // Prevent alert from stopping UI progress update
                alert('Upload successfully!');
            }, 1000);
            refreshBlobList();
        }
    });

    function refreshProgress() {
        setTimeout(function () {
            if (!finishedOrError) {
                var process = speedSummary.getCompletePercent();
                displayProcess(process);
                refreshProgress();
            }
        }, 200);
    }
    refreshProgress();
}
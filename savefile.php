<?php

if (!empty($_POST['data'])) {
    $data = $_POST['data'];
    $fname = mktime() . ".json";
    if (!empty($_GET['filename']) && $_GET['filename']!='undefined') {
        $fname = $_GET['filename'] . ".json";
    }
    $file = fopen("upload/" .$fname, 'w');
    fwrite($file, $data);
    fclose($file);
}

?>

<?php

if (!empty($_POST['data'])) {
    $data = $_POST['data'];
    $fname = mktime();
    if (!empty($_GET['filename']) && $_GET['filename']!='undefined') {
        $fname = $_GET['filename'];
    }
    $file = fopen("../upload/" .$fname, 'w');
    fwrite($file, $data);
    fclose($file);
}

?>

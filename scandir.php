<?php
    $files = array_diff(scandir('nets'), array('.', '..'));
    foreach ($files as $file) {
        echo $file . PHP_EOL;
    }
?>
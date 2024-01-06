<?php
    $files = array_diff(scandir("../".$_POST['dir']), array('.', '..'));
    foreach ($files as $file) {
        echo $file . PHP_EOL;
    }
?>
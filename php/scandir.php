<?php
// Lists the .pn files of one of the allowed folders (nets or upload).

$allowed = array('nets', 'upload');
$dir = isset($_POST['dir']) ? $_POST['dir'] : '';
if (!in_array($dir, $allowed, true)) { http_response_code(400); exit; }

$files = array_diff(scandir(__DIR__ . '/../' . $dir), array('.', '..'));
foreach ($files as $file) {
    if (preg_match('/\.pn$/i', $file)) echo $file . PHP_EOL;
}
?>

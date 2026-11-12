<?php
// Stores an uploaded net in ../upload/ (the "SEND" button).
// Only plain .pn file names are accepted: no paths, no other extensions.

if (empty($_POST['data'])) exit;
$data = $_POST['data'];
if (strlen($data) > 1000000) { http_response_code(413); exit; }   // 1 MB
if (strpos($data, 'Places:') === false) { http_response_code(400); exit; }

$fname = isset($_GET['filename']) ? basename($_GET['filename']) : '';
if (!preg_match('/^[A-Za-z0-9_.-]{1,80}\.pn$/', $fname)) {
    $fname = time() . '.pn';
}
file_put_contents(__DIR__ . '/../upload/' . $fname, $data);
?>

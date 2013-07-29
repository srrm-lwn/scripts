#!/bin/bash

if [ $# -ne 3 ]; then
	echo "Usage: $0 <reports directory> <directory to analyze> <email address>"
	exit 1
fi

reports_dir=$1
dir=$2
email=$3

if [ ! -d $reports_dir ]; then
	echo "Reports directory $reports_dir not found!"
	exit 1
fi

today=`date +"%y%m%d"`
output_txt_file="$reports_dir/disk_space_$today.txt"
output_html_file="$reports_dir/disk_space_$today.html"


echo "Starting Disk Space report on $dir for $today"
echo "Entering $dir"
cd $dir


echo "Analyzing disk space"
echo "Monitor by running: tail -2000f $reports_dir/disk_space_$today.txt"

du -sk * > $output_txt_file

echo "Completed analyzing disk space"
echo "Generating Report"

python $reports_dir/report.py $reports_dir

if [ ! -e $output_html_file ]; then
	echo "HTML Report - $output_html_file - not found"
	exit 1
fi

echo "Emailing report"

mail -s "$(echo "Disk Space Report [$today]\nContent-Type: text/html")" $email < $output_html_file

echo "Completed Disk Space report on $dir for $today"
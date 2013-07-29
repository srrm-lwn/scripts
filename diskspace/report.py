from datetime import date
from datetime import timedelta
from operator import itemgetter
import sys


def main():
	if len(sys.argv) != 2:
		print "Usage: %s <dir with report>" % sys.argv[0]
		return
	
	dir = sys.argv[1]
		
	today = date.today()
	todaysFile = dir+"/" + disk_space_file(today)

	yesterday = today - timedelta(1)
	yesterdaysFile = dir + "/" + disk_space_file(yesterday)
	
	todaysMap = read_into_map(todaysFile)
	yesterdaysMap = read_into_map(yesterdaysFile)
	sortedDiffs = get_sorted_diffs(todaysMap, yesterdaysMap)
	resultsFile = dir + "/" + disk_space_file(today, ".html")
	create_html_report(resultsFile, sortedDiffs, todaysMap, yesterdaysMap, today, yesterday)	

def disk_space_file(date, extension=".txt"):
	return "disk_space_" + date_format(date) + extension
	
def date_format(date):
	return date.strftime("%y%m%d")
	
def read_into_map(filename):
	map = {}
	try:
		with open(filename) as file:
			for line in file.readlines():
				parts = line.rstrip().split("\t")
 				map[parts[1]]=int(parts[0])
 	except IOError:
 		print "File " + filename + " not found!"
			
 	return map
 	
def get_sorted_diffs(todaysMap, yesterdaysMap):
	diffMap = {}
	for dir, size in todaysMap.items():
		yesterdaysSize = yesterdaysMap.get(dir, 0)
		diff = size - yesterdaysSize
		if diff != 0:
			diffMap[dir] = size - yesterdaysSize
	return sorted(diffMap.iteritems(), key=itemgetter(1), reverse=True)

	
def create_html_report(resultsFile, sortedDiffs, todaysMap, yesterdaysMap, today, yesterday):
	report = """
	<html><body><table border="1">
	<tr>
    <th>Directory</th>
    <th>Size Delta</th>
    <th>Current Size (kb.) - %s</th>
    <th>Previous Size (kb.) - %s</th>
  	</tr>
  	""" % (date_format(today), date_format(yesterday))
  	
  	for dir, diffSize in sortedDiffs:
  		report += """
  		<tr>
  		<td>%s</td>
  		<td>%s</td>
  		<td>%s</td>
  		<td>%s</td>
  		</tr>
  		""" % (dir, diffSize, todaysMap.get(dir, "N/A"), yesterdaysMap.get(dir, "N/A"))
  	
  	report += "</table></body></html>"
  	
  	with open(resultsFile, "w+") as file:
  		file.write(report)
  		
  	print "report generated!"	
	

if  __name__ =='__main__':
	main()

	


	

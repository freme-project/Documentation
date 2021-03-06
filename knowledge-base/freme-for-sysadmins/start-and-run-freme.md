---
layout: page
title: Starting and running FREME
dropdown: Knowledge Base, FREME for System Administrators
pos: 4.17
---
# Starting and Running FREME

This guide explains how to install and run FREME.

## Pre requisites

* A server that meets the [FREME hardware requirements](freme-hardware-requirements.html) and has a Linux operating system installed. FREME works on other operating systems also but this guide targets Linux servers.
* Java 8 or higher installed on the web server
* A FREME package. See [Creating and running a FREME package](creating-and-running-a-freme-package.html) for more information.
* Depending on the services you use you might need to have a MySQL webserver installed. FREME can also be configured to run with other databases, so MySQL is not obligatory. See [configuration options](../freme-for-sysadmins/configuration-options.html) for more information on how to configure the database.

## Installation procedure

* Copy the freme package to the installation folder, e.g. to /opt/freme
* FREME configuration options are explained in more detail in [this article](creating-and-running-a-freme-package.html) and [FREME configuration options](configuration-options.html).
* Make scripts executable: chmod +x /opt/freme/bin/*
* Start FREME by running one of the following scripts:
  * ```/opt/freme/bin/start_server.sh```
  Check logfiles to see if everything works fine: ```tail -f /opt/freme/logs/broker.log```  
  Properties defined in the start-properties file inside the config folder are loaded.
  You can use the current shell for other purposes while the process keeps running even if the shell is closed.
  *  ```/opt/freme/bin/start_local.sh``` 
  This is useful for local development since the logging output is printed to 
  the console. When you close the shell, the process stops. 
*  Stop FREME with this file: ```/opt/freme/bin/stop_server.sh```
* When the installation is finished you can test it using the Test Suite which is described in the [Getting started article](gettingStarted_SysAdmins.html).


### Creating a start / stop script

You can copy the script from /opt/freme/bin/server_start_script.sh to /etc/init.d/freme . You need to edit the script and change the variable FREME_DIR to point to your FREME installation folder. Then you can start, restart and stop FREME using these commands:

```
service freme start
service freme restart
service freme stop
```

### Too many open files bug

An open bug in FREME leads to streams that are opened but not closed. When there are too many open streams then FREME cannot open more streams. This happens only under special circumstances and when FREME is used heavily, e.g. after 10.000 API calls. It results in errors during API calls with error messages like "Internal server error". The log files show the message "Too many open files". The easiest workaround is to restart FREME regularly, e.g. by a cronjob every midnight.  

## Tips

### Prevent loosing connection to MySQL database

We had the issue that the connection to the MySQL database gets lost when FREME is idle for some hours. This problem can be overcome by adding these parameters to application.properties:

```
spring.datasource.testOnBorrow=true
spring.datasource.validationQuery=SELECT 1
```

### FREME hangs during startup

On ubuntu servers we observed the problem that sometimes FREME freezes during startup. The last log message before the freeze is "Mapping servlet: 'dispatcherServlet' to [/]" or "create new admin user". This can be a problem with the secure random number generator. You can overcome this problem by starting FREME with this command line option:

```
-Djava.security.egd=file:/dev/./urandom
```

E.g. through creating a configuration file "start-properties" with this content:

```
START_ARGS="-Djava.security.egd=file:/dev/./urandom"
```


### Update an existing FREME installation

To update an existing FREME installation follow these steps:

1. Backup the existing FREME package
2. Download the latest FREME package. Usually you can checkout the latest release tag from the [git repository](github.com/freme-project/freme-packages/) and run mvn package (see [Create and run a FREME package](creating-and-running-a-freme-package.html).
3. Stop the old FREME package
4. Replace the existing FREME package with the new package (but you still have a backup of the old package).
5. Delete the config folder of the new FREME package and replace it with the config folder of the old package.
6. Start the new FREME package

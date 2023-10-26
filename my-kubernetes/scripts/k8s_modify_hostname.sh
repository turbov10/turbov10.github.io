#!/bin/bash

NEW_HOSTNAME=""
IP_ADDRESS=""
while getopts ":h:i:n" arg
do
  case $arg in
    h)
      echo "build_add.sh [-n NEW_HOSTNAME][-i IP_ADDRESS]"
      echo "  -n NEW_HOSTNAME: the new hostname."
      echo "  -i IP_ADDRESS: IP address."
      exit 0
      ;;
    i)
      IP_ADDRESS=$OPTARG
      echo "$arg##$OPTARG"
      ;;
    n)
      NEW_HOSTNAME=$OPTARG
      echo "$arg##$OPTARG"
      ;;
    ?)
      echo "Unknown Argument -$OPTARG"
      exit 1
      ;;
  esac
done

if [ "${NEW_HOSTNAME}" == "" ]; then
  echo "No [-n] new hostname specified"
  exit 1
fi

if [ "${IP_ADDRESS}" == "" ]; then
  echo "No [-i] ip address specified"
  exit 1
fi

echo "###### Dangerous ######"
hostname ${NEW_HOSTNAME}
echo "${NEW_HOSTNAME}" > /etc/hostname
echo "HOSTNAME=${NEW_HOSTNAME}" >> /etc/sysconfig/network
echo "${IP_ADDRESS} ${NEW_HOSTNAME} ${NEW_HOSTNAME}" >> /etc/hosts

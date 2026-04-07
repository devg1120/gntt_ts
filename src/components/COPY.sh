echo copy to [$1]
echo y/n
read input 

if [ -z $input ] ; then
   echo cancel!!
   exit 1

elif [ $input = 'yes' ] || [ $input = 'YES' ] || [ $input = 'y' ] ; then
   echo ""

else
   echo cancel!!
   exit 1
fi

echo $1 "copy"

if [ -f  ../../../gntt_org2/src/components/$1 ] ; then

   echo exist  ../../../gntt_org2/src/components/$1
   cp ../../../gntt_org2/src/components/$1 .
else
   echo not exist  ../../../gntt_org2/src/components/$1
    
fi

for f in *.jsx; do
  mv "$f" "${f%.jsx}.tsx"
done


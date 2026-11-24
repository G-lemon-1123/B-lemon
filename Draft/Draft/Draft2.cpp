#include<iostream>
using namespace std;
int main()
{
	int i, sum;
	sum = 0;
	for (i = 0; i <= 15;)
	{
		sum += i;
		i++;
	}
	cout << sum << endl;
	return 0;
}

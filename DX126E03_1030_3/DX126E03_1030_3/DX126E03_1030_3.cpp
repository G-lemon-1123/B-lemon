#include<iostream>
using namespace std;
int main()
{
	char ch;
	char letterstr[41] = { 0 };
	char digitstr[41] = { 0 };
	int num = 0;
	int letter = 0;
	int other = 0;
	int let = 0;
	int dig = 0;
	cout << "请输入一行字符：";
	for(int i=0;i<40;i++)
	{
		cin.get(ch);
		if (ch == '\n')
			break;
		if (ch >= '0'&&ch <= '9')
		{
			num++;
			char newl = 'A' + (ch - '0');
			digitstr[dig] = newl;
			dig++;
		}
		else if (ch >= 'a'&&ch <= 'z')
		{
			letter++;
			char newl1 = 'A' + (ch - 'a');
			letterstr[let] = newl1;
			let++;
		}
		else if (ch >= 'A'&&ch <= 'Z')
		{
			letter++;
			char newl2 = 'a' + (ch - 'A');
			letterstr[let] = newl2;
			let++;
		}
		else 
		{
			other++;
		}
	}
	letterstr[let] = '\0';
	digitstr[dig] = '\0';
	cout << "一共有" << num << "个数字，" << letter << "个字母和" << other << "个其他字符" << endl;
	cout << "letterstr数组内容：" << letterstr << endl;
	cout << "digitstr数组内容：" << digitstr << endl;

	char str[41];
	cout << "请输入数字串（最长40）：";
	cin.getline(str, 41);
	int len = 0;
	while(str[len]!='\0')
	{
		len++;
	}
	bool x = true;
	int left = 0;
	int right = len - 1;
	while (left < right)
	{
		if (str[left] != str[right])
		{
			x = false;
		break;
		}
		left++;
		right--;
	}
	if (x)
		cout << "该数字串是回文字串" << endl;
	else
		cout << "该数字串不是回文子串" << endl;


	return 0;
}

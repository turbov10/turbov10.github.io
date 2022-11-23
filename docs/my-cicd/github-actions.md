
# Overview

GitHub Actions是一个CI/CD平台

# 组件和概念

asdasdasd

## 组件
asdasdas

### Workflows

Workflows定义在`.github/workflows`目录下

### Events

事件

### Jobs

任务，是流程中一系列步骤(steps)的集合

### Actions

An action is a custom application for the GitHub Actions platform that performs a complex but frequently repeated task.
Use an action to help reduce the amount of repetitive code that you write in your workflow files.

### Runners

Runner是运行Workflows的服务器。每一个Runner在同一时间只能运行一个Job。
GitHub提供了Ubuntu Linux，Microsoft Windows，MacOS的Runner来运行你的Workflow，并且每个Workflow将会在一个全新构建的虚拟机上运行。
请参考GitHub已提供的Runner规格[About GitHub-hosted runners](https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners)
GitHub也提供了更大型的Runner，请参考[Using larger runners](https://docs.github.com/en/actions/using-github-hosted-runners/using-larger-runners)

如果你需要使用其他操作系统，或者需要一台特殊硬件规格的机器。
你可以管理自己的服务器。参考[Hosting your own runners](https://docs.github.com/en/actions/hosting-your-own-runners)


- - -

# Finding and Customizing Actions

在Workflow中使用的Action可以被定义在:

* 同一个仓库(repository)，作为Workflow文件
* 任何公共仓库
* DockerHub上公开的Docker镜像

